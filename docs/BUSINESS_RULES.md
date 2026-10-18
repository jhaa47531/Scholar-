# SPIS Business Rules & Scoring Specification

## 1. Assessment Lifecycle & Data States

Assessment data must distinguish between explicit mutually exclusive states:
- **Not Configured**: Sessional assessment has not been configured for the semester.
- **Not Conducted**: Sessional was scheduled or defined, but not yet conducted.
- **Not Yet Available**: Assessment is ongoing or pending marking.
- **Draft**: Teacher has entered intermediate marks. Stored securely and strictly **invisible** to students.
- **Final Submitted**: Teacher has finalized and submitted marks. **Immediately visible** to the enrolled student.
- **Genuine Zero Marks**: Student took the exam/assessment and earned zero marks.
- **Missing Marks**: Required component is empty or unrecorded. Cannot be silently coerced to zero.
- **Examination Absence ("Not Attended")**: Student was absent from the examination. Score is recorded as 0, but exam attendance status is explicitly flagged as `NOT_ATTENDED`.

## 2. Weighted Performance Formula (Version 1.0)

Total Performance Score is calculated using 5 components totaling 100%:
- **Sessional Examination ($M$)**: 40% weight
- **Class Attendance ($A$)**: 20% weight
- **Assignment Performance ($S$)**: 15% weight
- **Presentation Performance ($R$)**: 15% weight
- **Class Interaction Performance ($I$)**: 10% weight

### Formula:
$$\text{Normalized Sessional Score } M = \left(\frac{\text{Obtained Marks}}{\text{Maximum Marks}}\right) \times 100$$
$$\text{Performance Score} = 0.40M + 0.20A + 0.15S + 0.15R + 0.10I$$

### Incomplete Policy:
If any required component ($M, A, S, R, I$) is missing or invalid:
- No definitive score is computed.
- The assessment status is marked `INCOMPLETE`.
- Missing component names are recorded and displayed to the user.

## 3. Overall Sessional Report Preconditions

Separate reports must be maintained for Sessional 1 and Sessional 2.
An Overall Sessional Report can ONLY be generated when:
1. The sessional is active and configured.
2. All mandatory/required subjects for the student's curriculum and semester have `FINAL_SUBMITTED` records.
3. All configured elective group rules are satisfied (e.g. required 1 elective from Elective Group A).
4. All required scoring components for each subject are complete and valid.
5. Snapshot contains frozen weights, formula version `v1.0`, subject breakdown, and generation timestamp.
