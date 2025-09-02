export const DEFAULT_PLE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PLE Report Card</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
        }
        .school-logo { 
            width: 80px; 
            height: 80px; 
            margin: 0 auto 10px; 
        }
        .school-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .report-title { 
            font-size: 20px; 
            color: #666; 
        }
        .student-info { 
            display: flex; 
            justify-content: space-between; 
            margin: 20px 0; 
        }
        .results-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        .results-table th, 
        .results-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center; 
        }
        .results-table th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
        }
        .grade { 
            font-weight: bold; 
            padding: 4px 8px; 
            border-radius: 4px; 
            color: white; 
        }
        .summary { 
            margin: 20px 0; 
            padding: 15px; 
            background-color: #f9f9f9; 
            border-radius: 5px; 
        }
        .comments { 
            margin: 20px 0; 
        }
        .footer { 
            margin-top: 40px; 
            border-top: 1px solid #ddd; 
            padding-top: 20px; 
            display: flex; 
            justify-content: space-between; 
        }
    </style>
</head>
<body>
    <div class="header">
        {{#if school.logoUrl}}
        <img src="{{school.logoUrl}}" alt="School Logo" class="school-logo">
        {{/if}}
        <div class="school-name">{{school.name}}</div>
        <div class="report-title">PRIMARY LEAVING EXAMINATION REPORT CARD</div>
        <div style="margin-top: 10px;">Term {{reportCard.term}}, {{reportCard.year}}</div>
    </div>

    <div class="student-info">
        <div>
            <strong>Student Name:</strong> {{student.firstName}} {{student.lastName}}<br>
            <strong>Class:</strong> {{student.class}} {{student.stream}}<br>
            {{#if student.lin}}<strong>LIN:</strong> {{student.lin}}<br>{{/if}}
        </div>
        <div>
            <strong>Report Date:</strong> {{formatDate generatedAt 'long'}}<br>
            <strong>Next Term Begins:</strong> {{formatDate reportCard.nextTermBegins 'short'}}<br>
        </div>
    </div>

    <div class="section-title">Principal Subjects</div>
    <table class="results-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Interpretation</th>
            </tr>
        </thead>
        <tbody>
            {{#each results.principalSubjects}}
            <tr>
                <td>{{this.subjectName}}</td>
                <td>{{this.score}}</td>
                <td>
                    <span class="grade" style="background-color: {{gradeColor this.grade}}">
                        {{this.grade}}
                    </span>
                </td>
                <td>{{this.points}}</td>
                <td>{{gradeInterpretation this.grade 'UACE'}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    {{#if results.subsidiarySubjects}}
    <div class="section-title">Subsidiary Subjects</div>
    <table class="results-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {{#each results.subsidiarySubjects}}
            <tr>
                <td>{{this.subjectName}}</td>
                <td>{{this.score}}</td>
                <td>
                    <span class="grade" style="background-color: {{gradeColor this.grade}}">
                        {{this.grade}}
                    </span>
                </td>
                <td>{{#if this.points}}Pass{{else}}Fail{{/if}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <div class="summary">
        <h3>Summary</h3>
        <strong>Total Points:</strong> {{results.totalPoints}}<br>
        <strong>Principal Subjects:</strong> {{length results.principalSubjects}}<br>
        <strong>Subsidiary Passes:</strong> {{length results.subsidiarySubjects}}<br>
    </div>

    {{#if reportCard.classTeacherComment}}
    <div class="comments">
        <h3>Class Teacher's Comment</h3>
        <p>{{reportCard.classTeacherComment}}</p>
    </div>
    {{/if}}

    {{#if reportCard.headTeacherComment}}
    <div class="comments">
        <h3>Head Teacher's Comment</h3>
        <p>{{reportCard.headTeacherComment}}</p>
    </div>
    {{/if}}

    <div class="footer">
        <div>
            <strong>Class Teacher</strong><br>
            Signature: _________________
        </div>
        <div>
            <strong>Head Teacher</strong><br>
            Signature: _________________
        </div>
    </div>
</body>
</html>
`;
