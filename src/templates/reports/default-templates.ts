export const DEFAULT_PLE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{student.firstName}} {{student.lastName}} - PLE Report Card</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .school-logo {
            max-width: 80px;
            max-height: 80px;
            margin-bottom: 10px;
        }

        .school-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .school-details {
            font-size: 11px;
            margin-bottom: 10px;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 15px;
        }

        .student-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
        }

        .student-details {
            flex: 1;
        }

        .student-photo {
            width: 100px;
            height: 120px;
            border: 1px solid #000;
            object-fit: cover;
        }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .grades-table th,
        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
        }

        .grades-table th {
            background-color: #e0e0e0;
            font-weight: bold;
        }

        .summary-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
        }

        .summary-box {
            flex: 1;
            margin: 0 10px;
            padding: 15px;
            border: 1px solid #000;
            text-align: center;
        }

        .summary-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
        }

        .signature-section {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        {{#if school.logoUrl}}
        <img src="{{school.logoUrl}}" alt="School Logo" class="school-logo">
        {{/if}}
        <div class="school-name">{{school.name}}</div>
        <div class="school-details">
            {{#if school.address}}{{school.address}}<br>{{/if}}
            {{#if school.city}}{{school.city}}, {{/if}}{{#if school.district}}{{school.district}}<br>{{/if}}
            {{#if school.phone}}Tel: {{school.phone}} | {{/if}}
            {{#if school.email}}Email: {{school.email}}{{/if}}
        </div>
        <div class="report-title">PRIMARY LEAVING EXAMINATION REPORT CARD</div>
    </div>

    <div class="student-info">
        <div class="student-details">
            <p><strong>Name:</strong> {{student.firstName}} {{student.middleName}} {{student.lastName}}</p>
            <p><strong>LIN:</strong> {{student.lin}}</p>
            <p><strong>Class:</strong> {{student.class}} {{student.stream}}</p>
            <p><strong>Academic Year:</strong> {{academicYear}}</p>
            <p><strong>Term:</strong> {{term}}</p>
            <p><strong>Date of Birth:</strong> {{formatDate student.dateOfBirth}}</p>
            <p><strong>Gender:</strong> {{student.gender}}</p>
        </div>
        {{#if student.photoUrl}}
        <img src="{{student.photoUrl}}" alt="Student Photo" class="student-photo">
        {{/if}}
    </div>

    <table class="grades-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>CA Score (40%)</th>
                <th>Exam Score (60%)</th>
                <th>Total Score</th>
                <th>Grade</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            {{#each assessments}}
            <tr>
                <td>{{subject.name}}</td>
                <td>{{formatNumber caScore 1}}</td>
                <td>{{formatNumber examScore 1}}</td>
                <td>{{formatNumber (add caScore examScore) 1}}</td>
                <td>{{grade (add caScore examScore) ../examLevel}}</td>
                <td>{{remark}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="summary-section">
        <div class="summary-box">
            <div class="summary-title">Total Subjects</div>
            <div class="summary-value">{{statistics.totalSubjects}}</div>
        </div>
        <div class="summary-box">
            <div class="summary-title">Average Score</div>
            <div class="summary-value">{{formatNumber statistics.averageScore 1}}%</div>
        </div>
        <div class="summary-box">
            <div class="summary-title">Total Marks</div>
            <div class="summary-value">{{formatNumber statistics.totalMarks 1}}</div>
        </div>
    </div>

    <div class="footer">
        <div class="signature-section">
            <div class="signature-line">Class Teacher</div>
        </div>
        <div class="signature-section">
            <div class="signature-line">Head Teacher</div>
        </div>
        <div class="signature-section">
            <div class="signature-line">Parent/Guardian</div>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #666;">
        Generated on {{formatDate generatedAt}} | Powered by Marka Report System
    </div>
</body>
</html>
`;

export const DEFAULT_UCE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{student.firstName}} {{student.lastName}} - UCE Report Card</title>
    <style>
        /* Similar styling to PLE template with UCE-specific modifications */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 15px;
            color: #0066cc;
        }
        .student-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
        }

        .student-details {
            flex: 1;
        }

        .student-photo {
            width: 100px;
            height: 120px;
            border: 1px solid #000;
            object-fit: cover;
        }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .grades-table th,
        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
        }

        .grades-table th {
            background-color: #e0e0e0;
            font-weight: bold;
        }

        .summary-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
        }

        .summary-box {
            flex: 1;
            margin: 0 10px;
            padding: 15px;
            border: 1px solid #000;
            text-align: center;
        }

        .summary-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
        }

        .signature-section {
            text-align: center;
            width: 200px;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
        }

        /* Include similar styling as PLE template but with UCE-specific colors and layout */
    </style>
</head>
<body>
    <!-- Similar structure to PLE template with UCE-specific content -->
    <div class="header">
        {{#if school.logoUrl}}
        <img src="{{school.logoUrl}}" alt="School Logo" class="school-logo">
        {{/if}}
        <div class="school-name">{{school.name}}</div>
        <div class="report-title">UGANDA CERTIFICATE OF EDUCATION REPORT CARD</div>
    </div>

    <!-- Include student info, grades table, and footer similar to PLE template -->
</body>
</html>
`;
