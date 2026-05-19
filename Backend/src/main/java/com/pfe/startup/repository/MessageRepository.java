package com.pfe.startup.repository;

import com.pfe.startup.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender=:a AND m.receiver=:b) OR (m.sender=:b AND m.receiver=:a) ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("a") String a, @Param("b") String b);

    List<Message> findByGroupeIdOrderBySentAtAsc(Long groupeId);

    long countByReceiverAndLuFalse(String receiver);

    @Query("SELECT DISTINCT CASE WHEN m.sender=:e THEN m.receiver ELSE m.sender END FROM Message m WHERE m.sender=:e OR m.receiver=:e")
    List<String> findContacts(@Param("e") String email);

    @Modifying @Transactional
    @Query("DELETE FROM Message m WHERE (m.sender=:a AND m.receiver=:b) OR (m.sender=:b AND m.receiver=:a)")
    void deleteConversation(@Param("a") String a, @Param("b") String b);
}