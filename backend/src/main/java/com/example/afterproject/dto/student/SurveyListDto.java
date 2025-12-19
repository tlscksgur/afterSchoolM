package com.example.afterproject.dto.student;

import com.example.afterproject.entity.CourseEntity;
import com.example.afterproject.entity.SurveyEntity;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 2.4. 설문조사 목록 조회 시 응답 DTO
 */
@Getter
public class SurveyListDto {
    private final Long surveyId;
    private final String title;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final boolean isSubmitted; // 학생의 참여 여부
    private final Long courseId;       // 전체 설문인 경우 null
    private final String courseName;   // 전체 설문인 경우 null

    public SurveyListDto(SurveyEntity survey, boolean isSubmitted) {
        this.surveyId = survey.getSurveyId();
        this.title = survey.getTitle();
        this.startDate = survey.getStartDate();
        this.endDate = survey.getEndDate();
        this.isSubmitted = isSubmitted;

        CourseEntity course = survey.getCourse();
        if (course != null) {
            this.courseId = course.getCourseId();
            this.courseName = course.getCourseName();
        } else {
            this.courseId = null;
            this.courseName = null;
        }
    }
}


