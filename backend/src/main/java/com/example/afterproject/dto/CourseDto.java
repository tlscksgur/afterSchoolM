package com.example.afterproject.dto;

import com.example.afterproject.entity.CourseEntity;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CourseDto {
    private Long courseId;
    private String courseName;
    private String category;
    private String status;
    private String courseDays;
    private String courseTime;
    private String location;
    private int capacity;
    private long currentEnrollmentCount;
    private Instant createdAt;
    private String description;
    private Integer quarter;
    private String quarterLabel;
    private LocalDate endDate;
    private boolean ended;
    private Instant endedAt;

    public CourseDto(CourseEntity course) {
        this.courseId = course.getCourseId();
        this.courseName = course.getCourseName();
        this.category = course.getCategory();
        this.description = course.getDescription();
        this.status = course.getStatus();
        this.courseDays = course.getCourseDays();
        this.courseTime = course.getCourseTime();
        this.location = course.getLocation();
        this.capacity = course.getCapacity();
        this.createdAt = course.getCreatedAt();
        this.quarter = course.getQuarter();
        this.quarterLabel = course.getQuarterLabel();
        this.endDate = course.getAfterSchoolEndDate();
        this.ended = course.isEnded();
        this.endedAt = course.getEndedAt();
        this.currentEnrollmentCount = 0; // 예시 값
    }
}
