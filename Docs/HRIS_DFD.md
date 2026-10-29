# Human Resource Information System

## Module - 1
 - Administration and Management
    - System Administration
    - Work Timings and Attendance
    - Employee Profile Management
    - Succession Management
        - Job Confirmation
        - Scale of Pay Creation
        - Position Grade Change
        - Scale of Pay Details
    - Pay Fixation
    - Promotion
        - Promotion Details
            - Designation: Rural / Urban / Zone, Field to HQ
        - Promotion Policy
        - Promotion Checklist
    - Promotion Reports
        - Promotion Information        
    - Increment
        - Increment Details
            - Designation: Rural / Urban / Zone, Field to HQ
        - Increment Policy
        - Increment Checklist
    - Increment Reports
        - Increment Information        
    Transfer
        - Transfer Proposal
            - Transfer Details
            - Designation: Rural / Urban / Zone, Field to HQ
        - Transfer Letter Generate
        - Transfer Approval (Cancel,Send back to MR, Hardcopy Send to Director => Director Approved or Send back to MR  or HR, Director Rejection)
        - Transfer Approval History
        - Transfer Checklist
    - Transfer Reports
        - Transfer Information List
        - Transfer Information Report
        - Transfer Approval Status
        - Transfer Approval Status Report
        - Transfer Checklist Report
    - Transfer Configuration
        - Transfer Authority Config
            - Director Approval/Rejection
            - HR Approval/Rejection
            - ZM Approval/Rejection
            - RM Approval/Rejection
            - Zonal Approval
        - Approval Path Config
            - Transfer Approval Process [MR -> Receipent [RM or ZM or HR=> Approval] => Director]
    
    - Employee leave
        - Leave Policy
        - Leave Type
        - Leave Approval Authority
        - Leave Application
        - Leave Approval/Rejection
        - Leave Status
        - Leave Balance
        - Leave History

 
## Module - 2


###  Employee Loan
    1.Submit an online application in accordance with the organization’s employee loan policy.
    2.Establishing an automated loan approval path in accordance with lending policies.
    3.Automatic loan calculation system.
    4.Automatic loan settlement system based on zero balance.
    5.Loan reschedule & repayment system.
    6.Staff-based loan upload system, categorized by loan type.
    7.loan schedule Modify system.
    8.Loan approval, Loan calculation and Loan Cancelation  notification system.
    9.Loan Cancelation Process.
    10.Bulk Loan approval process System.
    11.According to the loan policy, it is not permitted to apply for a new loan of the same type without first settling any existing loan of that same type.
#### Report:
    1.Loan Approval and Loan schedule Report
    2.Loan Disbursement Report
    3.Employee wise loan status Report
    4.PF Fund and PF Loan Status report

    **Entity:**
    -   **Employee:** Applies for loans, receives notifications, views loan status.
    -   **Manager:** Reviews and approves/rejects loan applications.
    -   **Finance/HR Admin:** Maintains loan policies, manages loan data, generates reports.
    -   **PF Department:** Manages PF fund contributions and loans.

    **Data Flows:**

    1.  **Loan Application** (Employee → HR Admin)
    2.  **Loan Policy** (HR Admin → HRIS)
    3.  **Loan Request** (Employee → Manager)
    4.  **Approval Notification** (HRIS → Employee)
    5.  **Loan Disbursement** (Finance → Employee)
    6.  **PF Loan Data** (PF Dept → HRIS)
    7.  **Loan Status** (HRIS → Employee)

## Module - 3
####  Employee Welfare Fund
    1.Implement an online application system for the Employee Welfare Fund, with support for attachments.
    2.Employee Welfare Fund Online application approval path.
    3.Employee Welfare Fund Application Modify system.
    4.Employee Welfare Fund Approval notification system.
    5.SWF Application Cancelation Process.
    Report:
        1.Employee Welfare Fund Report (as required)
        2.Donation payment report
        3.Donation payment letter in Bengali (for staff-related purposes).
        4.Department , Grade , Zone and region wise monthly and yearly SWF report
        5.Staff-wise donation statement report
        6.Zone, Region and branch wise donation statement
        7.Employee-wise Employee Welfare Fund Slip Generation Report

## Module - 4
### Contributory provident fund
    1.  Set up PF rules in accordance with the policies
    2.  Set up rules in accordance with the policies.
    3.  PF Trusty Board signatory configuration.
    4.  Employee wise PF Profit upload.
    5.  Modify PF Balance and PF Profit.
    6.  Yearly profit with PF Balance notification.
    Report:
        1.Employee-wise PF slip report (including profit)
        2.Monthly PF statement report
        3.Profit with Yearly PF Statement report
        4.Employee wise PF and gratuity combine slip
        5.PF statement by Zone, Region, and Department
        6.Report for generating employee-wise Welfare Fund slips

## Module - 5
### Gratuity
    1. Gratuity rules setup as per policy
    2. Gratuity modify system
    3. Yearly Gratuity notification System
    4. Automatic gratuity membership system as per hr policy
    5. Gratuity Trusty Board signatory configuration
    6. Modify Gratuity Balance
    7. Gratuity Trusty Board Meeting Minutes generation system
    8. Yearly gratuity Profit notification 
    Report:
        1. Employee wise gratuity slip
        2. Profit with Yearly Gratuity Report
        3. Monthly gratuity statement report
        4. Profit with Yearly Gratuity Statement report
        5. Zone, Region and Department wise monthly and yearly gratuity statement report
        6. Employee wise PF, Welfare fund and gratuity combine slip




### Separation Management
    1. Resignation Approval System
    2. Employee Retirement System
    3. Approval Authority
    4. Resignation Reasons 
    5. End Service Benefits
    6. Benefit Mapping
    7. Liability Questionnaire
    8. Interview Questions
    9. Suspension Rules
    10. Retirement Salary Benefit
    11. Withhold
 - Separation Process
    1. Resignation Apply 
        1. Resignation Applies of Employees 
        2. Discontinue type (
                Temporarily, 
                Permanently, 
                Leave without pay, 
                Suspension, Termination) 
        3. Approval Authority (
                Work flow based approval 
                a. Reporting Manager Approval/Rejection 
                b. HR approval/Rejection)
        4. Resignation Information 
            a. Notice Period
            b. Resignation Reason
            c. Handover
            d. Last Working Day    
    2. Exit Interview        
    3. Termination Checklist
    4. Pending Requests
    5. Liability Collection
    6. Lay-Off
    7. Discontinue
    8. Suspend
    9. Final Settlement
Report
        1.Resignation Approval Status Report
        2.Resignation Approval History
        3.Resignation Checklist Report
        4.Resignation Reason Report
        5.End Service Benefit Report
        6.Benefit Mapping Report
        7.Liability Questionnaire Report
        8.Interview Questions Report
        9.Suspension Rules Report
        10.Retirement Salary Benefit Report
        11.Withhold Report
        12.Final Settlement Report  

## Module - 6
### Payroll    
        - Allowances
            Allowance Grades
            Branchwise Allowance
            Liability wise Allowance
            Employeewise Allowance
        - Deductions
            Deduction Grades
            Employeewise Deduction
        - Bonuses
            Bonus Grades
            Employeewise Bonus
        - Employee wise Tax
        - Tax Rebate
        - Income Tax Rules
        - Employeewise Currency
        - Withhold List
        - Salary Processes
            Monthly Salary Process
            Employeewise Salary Process        
        - Salary Anomaly
        - Modify Monthly Salary
        - Modify Monthly Income Tax
        - Arrear Salary
            Modify Monthly Arrear
        - Tax Chalan No
        - Adjustment Posting
        - Bonus Posting
            - Modify Bonus
        - Offcycle Payroll Payment
        - Year End
        - GL Mapping For Report
    Reports
            - Pay Slip
            - Pay Sheet
            - Pay Sheet For Approval
            - Salary Sheet
            - Salary Sheet BURO
            - Tax Statement
            - Tax Card
            - Tax Card With Certificate
            - Cerificate of Tax
            - Monthly Tax Deduction
            - Dynamic Salary Report
            - Bank Advice
            - Bank Deposite
            - Monthly Reconciliation
            - Reconcile Report (Head wise)
            - Perquisite
            - Salary Statement (Under Section 108)
            - Salary Comparison
            - Fluctuation
            - Arrear Adjustment
            - Salary Analysis
            - Basic Salary Report
            - Headwise Balance Report
            - Salary Certificate
            - CBS Data
            - CBS Bonus Data
            - CBS Upload NRB
            - Benefit Paid in Cash
            - Employees of Car Loan Ins.
            - Bonus Report
            - Salary Sheet
            - Office Note NRB
            - Group Wise Salary Report
            - Department Wise Salary Report
            - BP Voucher Report
            - Salary Break Up Report
            - Internal Memo Report
            - Earning Report
            - Headcount Variance Report
            - 108(A) NBR
## Module 7
### Recruitment & Applicant Tracking System (ATS)
#### Recruitment Analytics & Reports
    - Requisition Status Report
    - Circular Deployment & Channel Conversion Report
    - Examination Tabulation & Merit List Report
    - Time-to-Hire & Cost-per-Hire Analysis
    - Selected vs Joined Funnel Analysis
    - Quota & Demographics Compliance Report
#### Manpower Requisition & Approvals
    - Requisition Form
        - Login by (Department Admin / Branch Admin / Zone Admin / Admin)        
    - Headcount & Budget Validation Work Flow (HR > Finance > Management)
    - Multi-tier Approval Work Flow (HR > Finance > Management)
#### Job Circular & Channel Management
    - Circular Template Builder (JD, Specs, Skills, Grade)
    - Application Form Configuration (Custom mandatory fields)
    - Multi-Channel Deployment (Career Portal, External, IJP)
    - Tracking ID Generation Engine
#### Candidate Sourcing & Profile Management
    - Candidate Web Portal Enrollment
    - NID/Smart Card Deduplication System
    - Circular-wise Application Intake List
    - Candidate CV & Digital Document Repository
    - Automated Criteria Filtering (Age, Education, Location, Experience)
#### Examination & Assessment Workflow
    - Candidate Shortlisting (Basic & Advanced Filter)
    - Written/MCQ Exam Management:
        - Center & Hall Allocation
        - Roll Number & Seat Plan Generation
        - Admit Card Print (Print or PDF Download Option) and SMS sending button
        - Exam Attendance Management
        - Marks Tabulation & Cutoff Publishing
        - Practical Test Management
    - Viva Voce Management:
        - Viva Board & Member Roster Setup
        - Viva Exam Attendance Management
        - Member-wise Digital Scoring Sheet
        - Weighted Aggregate Score Computation
        - Merit List & Waiting List Publishing
#### Verification, Offer & Onboarding
    - Reference Check & Medical Verification Record
    - Guarantor & Security Clearance (MFI Specific)
    - Offer Letter Generation & Acceptance Tracking
    - Appointment Letter Issuance
    - Handover to Core HR (Auto Employee ID & Profile Migration to Module 1)
    - Handover to Training (Induction Nomination to Module 8)
#### Settings
    - Role based access
    - Viva Board & Member
    *** - Approval Work Flow (HR > Finance > Management) ***

## Module - 8
### Training Management
    - Basic Information
        - Category Entry
        - Code Prefix Entry
        - Training Entry
        - Type Entry
        - Training Topic Entry
        - Departmental Matrix
        - Cost & Payment Rules
        - Miscellaneous
        - Trainer Entry
        - Topic Mapping For Trainer
    Configuration Manager
        - Matrix Mapping
        - Approval Path
        - Bypass Configuration
        - File Upload
    Training Planning
        - Training Needs Analysis
        - Training Calendar
        - Nomination From Department    
    Approval Process    
        - Training Needs Analysis
        - Training Calendar
        - Nomination From Department
        - Training Information
        - Cost & Payment
        - Trainer Info.
        - Training Circular
        - Attachment File
        - Nomination From Employee
        - Sending Message(For Trainer)
        - Training Schedule
        - Training Conduct
        - Training Attendance
        - Training Evaluation
        - Training Feedback
        - Training Certificate
        - Training Cost & Payment
        - Training Ledger
        - Sending Message(For Employee)   
    Monthly Programme
        - Employee wise Programme Received 
        - Employee wise Programme Assigned 
        - Employee wise Programme Schedule
        - Employee wise Programme Completion Certificate
        - Employee wise Programme Cost & Payment
        - Employee wise Programme Ledger
        - Employee wise Sending Message
        - Calendar Summary    
        - Reminder (For Employee)
        - Confirmation (For Employee)
        - Attendance (For Employee)
        - Evaluation (For Employee)
        - Feedback (For Employee)
        - Certificate (For Employee)
        - Notice Board
        - Reminder (For Trainer)
    Training Analysis
        - Training Needs Analysis
        - Training Calendar
        - Nomination From Department
        - Training Information
        - Cost & Payment
        - Trainer Info.
        - Training Circular
        - Attachment File
        - Nomination From Employee
        - Sending Message(For Trainer)
        - Training Schedule
        - Training Conduct
        - Training Attendance
        - Training Evaluation
        - Training Feedback
        - Training Certificate
        - Training Cost & Payment
        - Training Ledger
        - Sending Message(For Employee)      


9