import bcrypt from "bcrypt";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    // ── Admin user ──
    const email = process.env.ADMIN_EMAIL ?? "admin@gdg.local";
    const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
        where: { email },
        update: { password: hash, role: Role.ADMIN, status: UserStatus.APPROVED },
        create: {
            email,
            password: hash,
            name: "Event Admin",
            college: "GDG Spectrum",
            role: Role.ADMIN,
            status: UserStatus.APPROVED,
        },
    });
    // ── Event state ──
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton", currentRound: 0 },
    });
    // ── Round 1: Algorithmic Coding Problems (Java) ──
    const p1 = await prisma.problem.create({
        data: {
            title: "Smart Campus Entry Tracker",
            description: `Greenwood University has installed an IoT-based infrared scanner at the entrance of the "Great Hall" for a career fair. Every time a student passes through the gate, their RFID tag is scanned.

The system logs two types of events:
• Entry (+ ID): The student enters the hall.
• Exit (- ID): The student leaves the hall.

The Issue: The Security Department has noticed that some students are "tailgating" (slipping through the door behind someone else). This causes a logic error where the system records a student leaving the hall who was never recorded entering.

Input Format:
- First line: N (Number of logs)
- Next N lines: + ID or - ID

Output Format:
- Final count of students inside, or "INVALID" if any exit has no matching entry.`,
            difficulty: "Easy",
            roundNumber: 1,
            starterCode: `import java.util.*;

public class EventTracker {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "5\n+ 1\n+ 2\n- 1\n+ 3\n- 2", expected: "1", isHidden: false },
                    { input: "4\n+ 10\n+ 20\n- 10\n- 20", expected: "0", isHidden: false },
                    { input: "3\n+ 1\n- 2\n- 1", expected: "INVALID", isHidden: true },
                ],
            },
        },
    });
    const p2 = await prisma.problem.create({
        data: {
            title: "Freelance Project Optimizer",
            description: `You are a freelance software developer with a list of N pending contracts. Each contract has a specific Time Requirement (days to complete) and a Strict Deadline (the day it must be submitted).

You work sequentially; you can only work on one project at a time. You cannot submit a project even one minute past its deadline. Your goal is to maximize your portfolio by completing the highest number of tasks possible.

Input Format:
- First line: N
- Next N lines: duration deadline

Output Format:
- Maximum tasks completed.`,
            difficulty: "Medium",
            roundNumber: 1,
            starterCode: `import java.util.*;

public class PortfolioManager {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "3\n2 5\n1 3\n2 7", expected: "3", isHidden: false },
                    { input: "3\n3 3\n2 3\n1 3", expected: "1", isHidden: false },
                    { input: "4\n2 2\n1 2\n2 3\n1 3", expected: "2", isHidden: true },
                ],
            },
        },
    });
    const p3 = await prisma.problem.create({
        data: {
            title: "Flash-Chat Anti-Spam Filter",
            description: `A messaging app, "Flash-Chat," prevents bot attacks by enforcing a Cooldown Rule (K). If a message is sent at time T, the system blocks any further messages from that user until at least K seconds have passed.

Critical Rule: Only successfully sent messages reset the cooldown timer. If a message is blocked, the "last successful time" remains the same.

Input Format:
- First line: N (Total messages) and K (Cooldown)
- Second line: N space-separated timestamps.

Output Format:
- Total number of blocked messages.`,
            difficulty: "Medium",
            roundNumber: 1,
            starterCode: `import java.util.*;

public class SpamFilter {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
            timeLimit: 900,
            testCases: {
                create: [
                    { input: "5 3\n1 2 4 6 7", expected: "2", isHidden: false },
                    { input: "5 2\n1 3 5 7 9", expected: "0", isHidden: false },
                    { input: "5 5\n1 2 3 4 5", expected: "4", isHidden: true },
                ],
            },
        },
    });
    // ── Round 2: Debugging MCQ Questions ──
    // Debugging Q1: Inheritance, Constructor Chaining
    await prisma.quizQuestion.create({
        data: {
            questionText: "What is the primary reason the Employee constructor does not correctly assign values?",
            codeSnippet: `class Employee {
    protected String name;
    protected double salary
    Employee(String name, double salary){
        name = name;
        salary = salary;
    }
    public void displayInfo(){
        System.out.println("Employee Name: " + name);
        System.out.println("Salary: " + salary);
    }
}`,
            options: [
                "Missing semicolon after 'salary' declaration",
                "Parameters shadow instance variables — should use 'this.name' and 'this.salary'",
                "The constructor should be public",
                "displayInfo() should be static"
            ],
            correctIndex: 1,
            timeLimit: 45,
            points: 100,
            roundNumber: 2,
        },
    });
    await prisma.quizQuestion.create({
        data: {
            questionText: "What error exists in the Manager class?",
            codeSnippet: `class Manager extends Employee {
    private double bonus;
    Manager(String name, double salary, double bonus){
        this.bonus = bonus;
    }
    public double calculateSalary(){
        return salary + bonus
    }
}`,
            options: [
                "The bonus field should be public",
                "Missing super(name, salary) call in constructor and missing semicolon in calculateSalary()",
                "calculateSalary() should return an int",
                "Manager should not extend Employee"
            ],
            correctIndex: 1,
            timeLimit: 45,
            points: 100,
            roundNumber: 2,
        },
    });
    // Debugging Q2: Abstraction, Polymorphism
    await prisma.quizQuestion.create({
        data: {
            questionText: "What is wrong with the pay() method in the Customer class?",
            codeSnippet: `class Customer extends User implements Payment {
    double walletBalance;
    Customer(String name, double balance){
        super(name);
        walletBalance = balance
    }
    public void pay(double amount){
        if(walletBalance > amount)
            walletBalance = walletBalance - amount;
            System.out.println("Payment Successful");
        else
            System.out.println("Insufficient Balance");
    }
}`,
            options: [
                "walletBalance should be private",
                "Missing curly braces around the if-else body — 'Payment Successful' always prints",
                "The method should return a boolean",
                "amount should be an int"
            ],
            correctIndex: 1,
            timeLimit: 45,
            points: 100,
            roundNumber: 2,
        },
    });
    await prisma.quizQuestion.create({
        data: {
            questionText: "Spot the error: why won't displayUser() compile correctly?",
            codeSnippet: `class Customer extends User implements Payment {
    // ...
    public void displayuser(){
        System.out.println("Customer: " + name);
    }
}
// Called as: c.displayUser();`,
            options: [
                "name should be accessed with getter",
                "displayuser() has wrong casing — should be displayUser() to match the abstract method",
                "The method needs @Override annotation",
                "println should use printf instead"
            ],
            correctIndex: 1,
            timeLimit: 30,
            points: 100,
            roundNumber: 2,
        },
    });
    // Debugging Q3: Static vs Instance, Encapsulation
    await prisma.quizQuestion.create({
        data: {
            questionText: "What is wrong with the issueBook() method?",
            codeSnippet: `class Library {
    private String bookName;
    private int issuedBooks;
    static int totalIssued;

    public void issueBook(){
        issuedBooks++;
        totalIssued + 1;
    }
    public void issueBook(int quantity){
        issuedBooks = issuedBooks + quantity;
        totalIssued = totalIssued + quantity
    }
}`,
            options: [
                "issuedBooks should be static",
                "'totalIssued + 1' is an expression, not assignment — should be 'totalIssued++' or 'totalIssued += 1'",
                "issueBook() cannot be overloaded",
                "bookName is never used so it causes an error"
            ],
            correctIndex: 1,
            timeLimit: 45,
            points: 100,
            roundNumber: 2,
        },
    });
    await prisma.quizQuestion.create({
        data: {
            questionText: "Why does getIssuedBooks() fail to compile?",
            codeSnippet: `class Library {
    private int issuedBooks;
    // ...
    public int getIssuedBooks(){
        return issuedbooks;
    }
}`,
            options: [
                "The method should return a String",
                "Variable name mismatch: 'issuedbooks' should be 'issuedBooks' (Java is case-sensitive)",
                "The return type is wrong",
                "Private fields cannot have getters"
            ],
            correctIndex: 1,
            timeLimit: 30,
            points: 100,
            roundNumber: 2,
        },
    });
    // ── Round 3: MVP Problem Statements ──
    await prisma.problem.create({
        data: {
            title: "Student Attendance Dashboard",
            description: `Build a web-based Student Attendance Dashboard MVP.

Requirements:
- A simple UI where a teacher can mark attendance for students
- Display a list of students with Present/Absent toggle
- Show attendance summary (total present, total absent, percentage)
- Data can be stored in-memory or localStorage (no backend required)

Tech: Use any framework/library. Focus on clean UI and working functionality.
Time: You have the full round duration to build this on VS Code.`,
            difficulty: "Medium",
            roundNumber: 3,
            timeLimit: 2700,
        },
    });
    await prisma.problem.create({
        data: {
            title: "Event Registration Portal",
            description: `Build a web-based Event Registration Portal MVP.

Requirements:
- Landing page with event details
- Registration form (name, email, phone, college)
- Display registered participants in a table/list
- Basic form validation
- Data can be stored in-memory or localStorage

Tech: Use any framework/library. Focus on clean UI and working functionality.
Time: You have the full round duration to build this on VS Code.`,
            difficulty: "Medium",
            roundNumber: 3,
            timeLimit: 2700,
        },
    });
    console.log("Seed complete.");
    console.log("  Admin: admin@gdg.local / Admin@123");
    console.log(`  Round 1 problems: 3 (IDs: ${p1.id}, ${p2.id}, ${p3.id})`);
    console.log("  Round 2 quiz questions: 6");
    console.log("  Round 3 MVP problems: 2");
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
