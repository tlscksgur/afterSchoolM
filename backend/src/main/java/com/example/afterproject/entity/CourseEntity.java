package com.example.afterproject.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "AFTER_COURSES")
@Getter
@Setter
@NoArgsConstructor
public class CourseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // MySQL용 변경
    @Column(name = "course_id")
    private Long courseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserEntity teacher;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "category")
    private String category;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "course_days")
    private String courseDays;

    @Column(name = "course_time")
    private String courseTime;

    @Column(name = "location")
    private String location;

    @Column(name = "capacity", nullable = false)
    private int capacity;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "quarter")
    private Integer quarter;

    @Column(name = "quarter_label")
    private String quarterLabel;

    @Column(name = "after_school_end_date")
    private LocalDate afterSchoolEndDate;

    @Column(name = "is_ended")
    private boolean ended;

    @Column(name = "ended_at")
    private Instant endedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @Builder
    public CourseEntity(UserEntity teacher, String courseName, String category, String description, String courseDays, String courseTime, String location, int capacity, String status, Integer quarter, String quarterLabel, LocalDate afterSchoolEndDate, boolean ended, Instant endedAt) {
        this.teacher = teacher;
        this.courseName = courseName;
        this.category = category;
        this.description = description;
        this.courseDays = courseDays;
        this.courseTime = courseTime;
        this.location = location;
        this.capacity = capacity;
        this.status = status;
        this.quarter = quarter;
        this.quarterLabel = quarterLabel;
        this.afterSchoolEndDate = afterSchoolEndDate;
        this.ended = ended;
        this.endedAt = endedAt;
    }
}
