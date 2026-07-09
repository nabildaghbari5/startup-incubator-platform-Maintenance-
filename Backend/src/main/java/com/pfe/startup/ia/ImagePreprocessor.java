package com.pfe.startup.ia;

import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.core.Mat;
import org.opencv.core.MatOfPoint;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.photo.Photo;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
@Slf4j
public class ImagePreprocessor {

    static {
        // charge la lib native OpenCV au démarrage
        nu.pattern.OpenCV.loadLocally();
    }

    public String preprocess(String inputPath) {
        Mat src = Imgcodecs.imread(inputPath);
        if (src.empty()) {
            throw new IllegalArgumentException("Impossible de lire l'image : " + inputPath);
        }

        Mat gray = toGrayscale(src);
        Mat denoised = denoise(gray);
        Mat thresholded = threshold(denoised);
        Mat deskewed = deskew(thresholded);

        String outputPath = buildOutputPath(inputPath);
        Imgcodecs.imwrite(outputPath, deskewed);

        // libération mémoire native
        src.release();
        gray.release();
        denoised.release();
        thresholded.release();
        deskewed.release();

        log.info("Image prétraitée sauvegardée : {}", outputPath);
        return outputPath;
    }

    private Mat toGrayscale(Mat src) {
        Mat gray = new Mat();
        Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY);
        return gray;
    }

    private Mat denoise(Mat src) {
        Mat dst = new Mat();
        Photo.fastNlMeansDenoising(src, dst, 10, 7, 21);
        return dst;
    }

    private Mat threshold(Mat src) {
        Mat dst = new Mat();
        Imgproc.threshold(src, dst, 0, 255,
                Imgproc.THRESH_BINARY | Imgproc.THRESH_OTSU);
        return dst;
    }

    private Mat deskew(Mat src) {
        Mat inverted = new Mat();
        Core.bitwise_not(src, inverted);

        MatOfPoint points = new MatOfPoint();
        Core.findNonZero(inverted, points);

        RotatedRect box = Imgproc.minAreaRect(new MatOfPoint2f(points.toArray()));
        double angle = box.angle;
        if (angle < -45) angle += 90;

        Point center = new Point(src.cols() / 2.0, src.rows() / 2.0);
        Mat rotMatrix = Imgproc.getRotationMatrix2D(center, angle, 1.0);

        Mat rotated = new Mat();
        Imgproc.warpAffine(src, rotated, rotMatrix, src.size(),
                Imgproc.INTER_CUBIC, Core.BORDER_REPLICATE);

        inverted.release();
        points.release();
        rotMatrix.release();
        return rotated;
    }

    private String buildOutputPath(String inputPath) {
        File original = new File(inputPath);
        String name = "preprocessed_" + original.getName();
        return new File(original.getParentFile(), name).getAbsolutePath();
    }
}
