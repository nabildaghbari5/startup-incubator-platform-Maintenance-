package com.pfe.startup.security;

import com.pfe.startup.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role",   user.getRole().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken((User) userDetails);
    }

    // extractEmail + extractUsername (alias) pour compatibilité JwtFilter
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractUsername(String token) {
        return extractEmail(token);
    }

    public Long extractUserId(String token) {
        Object id = getClaims(token).get("userId");
        if (id instanceof Integer) return ((Integer) id).longValue();
        if (id instanceof Long)    return (Long) id;
        return null;
    }

    public boolean isValid(String token, UserDetails user) {
        try {
            return extractEmail(token).equals(user.getUsername()) && !isExpired(token);
        } catch (Exception e) { return false; }
    }

    public boolean isTokenValid(String token, User user) {
        try {
            return extractEmail(token).equals(user.getEmail()) && !isExpired(token);
        } catch (Exception e) { return false; }
    }

    private boolean isExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}