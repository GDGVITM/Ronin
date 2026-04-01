import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

function normalizeSupabasePoolerUrl(url: string) {
  try {
    const parsed = new URL(url);
    const isPoolerHost = parsed.hostname.endsWith("pooler.supabase.com");
    const usesWrongPort = parsed.port === "5432";

    if (isPoolerHost) {
      if (usesWrongPort) {
        parsed.port = "6543";
      }

      // Supabase pooler runs through PgBouncer; this avoids prepared statement conflicts.
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }

      return parsed.toString();
    }
  } catch {
    // Keep original value if URL parsing fails.
  }

  return url;
}

const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is missing. Add it to server/.env before running prisma:seed.");
}

const databaseUrl = normalizeSupabasePoolerUrl(rawDatabaseUrl);
if (databaseUrl !== rawDatabaseUrl) {
  console.warn("[seed] Supabase pooler URL detected on port 5432. Using port 6543.");
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  // ── Admin user ──
  const email = process.env.ADMIN_EMAIL ?? "admin@gdg.local";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: "ADMIN", status: "APPROVED" },
    create: {
      email,
      password: hash,
      name: "Event Admin",
      college: "GDG Spectrum",
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  // ── Event state ──
  await prisma.eventState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", currentRound: 0 },
  });

  // Keep seed deterministic across repeated runs.
  await prisma.$transaction([
    prisma.submission.deleteMany({}),
    prisma.matchup.deleteMany({}),
    prisma.proctoringStatus.deleteMany({}),
    prisma.problem.deleteMany({}),
  ]);

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
      roundNumber: 2,
      hint: "Track currently present IDs using a HashSet. If an exit occurs for an ID not in the set, it's invalid.",
      starterCode: JSON.stringify({
        java: `import java.util.*; 
class Main{ 
public static void main(String[] args){ 
} 
}`,
        python: `def main(): 
    pass 
if __name__ == "__main__": 
    main()`,
        "c++": `#include <iostream> 
using namespace std; 
int main(){ 
return 0; 
    }`,
        javascript: `function main() {

    }

    main();`
      }),
      timeLimit: 900,
      testCases: {
        create: [
          { input: "5\n+ 1\n+ 2\n- 1\n+ 3\n- 2", expected: "1", isHidden: false },
          { input: "4\n+ 10\n+ 20\n- 10\n- 20", expected: "0", isHidden: false },
          { input: "6\n+ 5\n+ 6\n- 5\n+ 7\n- 6\n+ 8", expected: "2", isHidden: false },
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
      roundNumber: 2,
      hint: "Sort tasks by deadline. Iterate and maintain a Max-Heap of durations. Accept tasks if they fit; if not, swap against a longer accepted task to save time.",
      starterCode: {
        java: `import java.util.*; 
class Main{ 
public static void main(String[] args){ 
} 
}`,
        python: `def main(): 
    pass 
if __name__ == "__main__": 
    main()`,
        "c++": `#include <iostream> 
using namespace std; 
int main(){ 
return 0; 
    }`,
        javascript: `function main() {

    }

    main();`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { input: "3\n2 5\n1 3\n2 7", expected: "3", isHidden: false },
          { input: "3\n3 3\n2 3\n2 3", expected: "1", isHidden: false },
          { input: "4\n1 2\n2 4\n1 3\n2 5", expected: "3", isHidden: false },
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
      roundNumber: 2,
      hint: "Use a map to store the 'last successful time' for each user. Only update it if the current message is sent (i.e., time - last time >= K).",
      starterCode: {
        java: `import java.util.*; 
class Main{ 
public static void main(String[] args){ 
} 
}`,
        python: `def main(): 
    pass 
if __name__ == "__main__": 
    main()`,
        "c++": `#include <iostream> 
using namespace std; 
int main(){ 
return 0; 
    }`,
        javascript: `function main() {

    }

    main();`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { input: "5 3\n1 2 4 6 7", expected: "2", isHidden: false },
          { input: "5 2\n1 3 5 7 9", expected: "0", isHidden: false },
          { input: "6 4\n1 2 3 7 8 12", expected: "3", isHidden: false },
        ],
      },
    },
  });

  await prisma.problem.create({
    data: {
      title: "Session Window Analyzer",
      description: `A platform records login durations in minutes for N users. You are given a threshold K and must find the longest contiguous segment where every duration is <= K.

Input Format:
- First line: N K
- Second line: N space-separated integers

Output Format:
- Length of the longest valid contiguous segment.`,
      difficulty: "Medium",
      roundNumber: 2,
      hint: "Simulate a sliding window by iterating linearly. If value <= K, extend your window. If > K, reset your window length to 0.",
      starterCode: {
        java: `import java.util.*; 
class Main{ 
public static void main(String[] args){ 
} 
}`,
        python: `def main(): 
    pass 
if __name__ == "__main__": 
    main()`,
        "c++": `#include <iostream> 
using namespace std; 
int main(){ 
return 0; 
    }`,
        javascript: `function main() {

    }

    main();`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { input: "8 5\n2 3 6 1 4 5 7 2", expected: "3", isHidden: false },
          { input: "5 10\n1 2 3 4 5", expected: "5", isHidden: false },
          { input: "7 3\n1 2 3 4 1 2 3", expected: "3", isHidden: false },
        ],
      },
    },
  });

  await prisma.problem.create({
    data: {
      title: "Deadline Burst Scheduler",
      description: `You have N jobs. Each job takes 1 unit time and has a deadline d and reward r. You can complete at most one job per time slot. Maximize total reward by scheduling before deadlines.

Input Format:
- First line: N
- Next N lines: deadline reward

Output Format:
- Maximum total reward.`,
      difficulty: "Medium",
      roundNumber: 2,
      hint: "Sort jobs by deadline. Use a Min-Heap to store the *rewards* of selected jobs. If your selected jobs exceed the current deadline, remove the job with the minimum reward.",
      starterCode: {
        java: `import java.util.*;

class Main {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        // write your code here


    }
}`,
        python: `def main():

    n = int(input())

    # write your code here



if __name__ == "__main__":
    main()`,
        "c++": `#include <iostream>
using namespace std;

int main() {

    int n;
    cin >> n;

    // write your code here


    return 0;
}`,
    javascript: `function main() {

}

main();`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { input: "4\n4 70\n1 80\n1 30\n2 100", expected: "250", isHidden: false },
          { input: "3\n1 20\n2 50\n2 10", expected: "70", isHidden: false },
          { input: "5\n2 100\n1 19\n2 27\n1 25\n3 15", expected: "142", isHidden: false },
        ],
      },
    },
  });

  // ── Round 2: Debugging MCQ Questions ──

  // ── Round 2: Debugging Sniper ──

  const r2p1 = await prisma.problem.create({
    data: {
      title: "Inheritance & Constructor Chaining",
      description: `The following program models Employees and Managers in a company.
Managers receive a bonus added to their salary. The program should display the correct salary for both employees.
However, the code contains several syntax and logical errors. Debug and fix it.`,
      difficulty: "Medium",
      roundNumber: 1,
      starterCode: {
        java: `class Employee {

    protected String name
    protected double salary;

    Employee(String name, double salary){
        name = name;
        salary = salary;
    }

    public void displayInfo(){
        System.out.println("Employee Name: " + name)
        System.out.println("Salary: " + salary);
    }

    public double calculateSalary(){
        return salary
    }
}

class Manager extends Employee {

    private double bonus;

    Manager(String name, double salary, double bonus){

        this.bonus = bonus;

    }

    public double calculateSalary(){

        return salary + bonus

    }

    public void displayinfo(){

        System.out.println("Manager Name: " + name);
        System.out.println("Total Salary: " + calculateSalary());
    }
}

    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String n1 = sc.next();
        double s1 = sc.nextDouble(); // bug: scanner might need nextDouble
        String n2 = sc.next();
        double s2 = sc.nextDouble();
        double b2 = sc.nextDouble();

        Employee e1 = new Employee(n1, s1)

        Manager m1 = new Manager(n2, s2, b2);

        e1.displayInfo();

        m1.displayInfo();

    }`,
        python: `class Employee:
    def __init__(self, name, salary):
        name = name  
        salary = salary 

    def display_info(self):
        print("Employee Name: " + name) 
        print("Salary: " + str(salary))

    def calculate_salary(self):
        return salary

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        self.bonus = bonus

    def calculate_salary(self):
        return salary + bonus

    def display_info(self):
        print("Manager Name: " + self.name)
        print("Total Salary: " + str(self.calculate_salary()))

if __name__ == "__main__":
    line1 = input().split()
    n1 = line1[0]
    s1 = float(line1[1])
    
    line2 = input().split()
    n2 = line2[0]
    s2 = float(line2[1])
    b2 = float(line2[2])

    e1 = Employee(n1, s1)
    m1 = Manager(n2, s2, b2)

    e1.display_info()
    m1.display_info()`,
        "c++": `#include <iostream>
#include <string>
using namespace std;

class Employee {
protected:
    string name;
    double salary;

public:
    Employee(string n, double s) {
        name = n;
        salary = s;
    }

    void displayInfo() {
        cout << "Employee Name: " << name << endl
        cout << "Salary: " << salary << endl;
    }

    double calculateSalary() {
        return salary;
    }
};

class Manager : Employee {
    double bonus;

public:
    Manager(string n, double s, double b) : Employee(n, s) {
        bonus = b;
    }

    double calculateSalary() {
        return salary + bonus;
    }

    void displayInfo() {
        cout << "Manager Name: " << name << endl;
        cout << "Total Salary: " << calculateSalary() << endl;
    }
};

int main() {
    string n1, n2;
    double s1, s2, b2;
    
    cin >> n1 >> s1;
    cin >> n2 >> s2 >> b2;

    Employee e1(n1, s1);
    Manager m1(n2, s2, b2);

    e1.displayInfo();
    m1.displayInfo();

    return 0;
}`,
        javascript: `class Employee {
  constructor(name, salary) {
    name = name;
    salary = salary;
  }

  displayInfo() {
    console.log("Employee Name: " + name);
    console.log("Salary: " + salary);
  }

  calculateSalary() {
    return salary;
  }
}

class Manager extends Employee {
  constructor(name, salary, bonus) {
    this.bonus = bonus;
  }

  calculateSalary() {
    return salary + bonus;
  }

  displayinfo() {
    console.log("Manager Name: " + this.name);
    console.log("Total Salary: " + this.calculateSalary());
  }
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/);
let idx = 0;

const n1 = input[idx++];
const s1 = Number(input[idx++]);
const n2 = input[idx++];
const s2 = Number(input[idx++]);
const b2 = Number(input[idx++]);

const e1 = new Employee(n1, s1);
const m1 = new Manager(n2, s2, b2);

e1.displayInfo();
m1.displayInfo();`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { 
            input: "Rahul 50000\nPriya 70000 10000", 
            expected: `Employee Name: Rahul
Salary: 50000.0
Manager Name: Priya
Total Salary: 80000.0`, 
            isHidden: false 
          },
          { 
            input: "Alice 60000\nBob 80000 15000", 
            expected: `Employee Name: Alice
Salary: 60000.0
Manager Name: Bob
Total Salary: 95000.0`, 
            isHidden: false 
          },
          { 
            input: "John 40000\nDoe 90000 5000", 
            expected: `Employee Name: John
Salary: 40000.0
Manager Name: Doe
Total Salary: 95000.0`, 
            isHidden: false 
          },
        ],
      },
    },
  });

  const r2p2 = await prisma.problem.create({
    data: {
      title: "Abstraction, Polymorphism & Interfaces",
      description: `The program models a payment system where users can pay using Credit Card or PayPal.
However, the code contains syntax mistakes, incorrect overrides, and logical issues. Fix it so payments process correctly.`,
      difficulty: "Medium",
      roundNumber: 1,
      starterCode: {
        java: `public class PaymentSystem {

    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String name = sc.next();
        double bal = sc.nextDouble();
        double amt = sc.nextDouble();

        Payment p;

        Customer c = new Customer(name, bal);

        p = c;

        c.displayUser();

        p.pay(amt);

        System.out.println("Remaining Balance: " + c.walletBalance);

    }

}


interface Payment {

    void pay(double amount)

}

abstract class User {

    String name;

    User(String name) {
        name = name;
    }

    abstract void displayUser();

}

class Customer extends User implements Payment {

    double walletBalance;

    Customer(String name, double balance) {
        super(name);
        walletBalance = balance;
    }

    public void pay(double amount) {

        if (walletBalance < amount) {
            walletBalance = walletBalance - amount;
            System.out.println("Payment Successful");
        } else {
            System.out.println("Insufficient Balance");
        }

    }

    public void displayUser() {
        System.out.println("Customer: " + name);
    }

}`,
        python: `from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

class User(ABC):
    def __init__(self, name):
        name = name

    @abstractmethod
    def display_user(self):
        pass

class Customer(User, Payment):
    def __init__(self, name, balance):
        super().__init__(name)
        self.wallet_balance = balance

    def pay(self, amount):
        if self.wallet_balance < amount:
            self.wallet_balance = self.wallet_balance - amount
            print("Payment Successful")
        else:
            print("Insufficient Balance")

    def display_user(self):
        print("Customer: " + self.name)

if __name__ == "__main__":
    line = input().split()
    name = line[0]
    bal = float(line[1])
    amt = float(input())

    c = Customer(name, bal)
    c.display_user()
    c.pay(amt)
    print("Remaining Balance: " + str(c.wallet_balance))`,
        "c++": `#include <iostream>
#include <string>
using namespace std;

class Payment {
public:
    virtual void pay(double amount) = 0;
};

class User {
protected:
    string name;
public:
    User(string n) : name(n) {}
    virtual void displayUser() = 0;
};

class Customer : public User, public Payment {
    double walletBalance;
public:
    Customer(string n, double b) : User(n) {
        walletBalance = b;
    }

    void pay(double amount) override {
        if (walletBalance < amount) {
            walletBalance -= amount;
            cout << "Payment Successful" << endl;
        } else {
            cout << "Insufficient Balance" << endl;
        }
    }

    void displayUser() override {
        cout << "Customer: " << name << endl;
    }

    double getBalance() { return walletBalance; }
};

int main() {
    string name;
    double bal, amt;
    cin >> name >> bal >> amt;

    Customer c(name, bal);
    Payment* p = &c;

    c.displayUser();
    p->pay(amt);

    cout << "Remaining Balance: " << c.getBalance() << endl;
    return 0;
}`,
        javascript: `class User {
  constructor(name) {
    name = name;
  }

  displayUser() {}
}

class Customer extends User {
  constructor(name, balance) {
    super(name);
    this.walletBalance = balance;
  }

  pay(amount) {
    if (this.walletBalance < amount) {
      this.walletBalance = this.walletBalance - amount;
      console.log("Payment Successful");
    } else {
      console.log("Insufficient Balance");
    }
  }

  displayUser() {
    console.log("Customer: " + this.name);
  }
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/);

const name = input[0];
const bal = Number(input[1]);
const amt = Number(input[2]);

const c = new Customer(name, bal);
c.displayUser();
c.pay(amt);
console.log("Remaining Balance: " + c.walletBalance);`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { 
            input: "Arjun 2000\n500", 
            expected: `Customer: Arjun
Payment Successful
Remaining Balance: 1500.0`, 
            isHidden: false 
          },
          { 
            input: "Karan 1000\n1500", 
            expected: `Customer: Karan
Insufficient Balance
Remaining Balance: 1000.0`, 
            isHidden: false 
          },
          { 
            input: "Zara 5000\n5000", 
            expected: `Customer: Zara
Payment Successful
Remaining Balance: 0.0`, 
            isHidden: false 
          },
        ],
      },
    },
  });

  const r2p3 = await prisma.problem.create({
    data: {
      title: "Method Overloading & Static vs Instance",
      description: `The program models a Library system that tracks the number of books issued.
However, several logical and syntax errors prevent correct behavior. Fix the program.`,
      difficulty: "Medium",
      roundNumber: 1,
      starterCode: {
        java: `class Library {

    private String bookName;
    private int issuedBooks;

    static int totalIssued;

    Library(String name) {
        bookName = name;
        issuedBooks = 0
    }

    public void issueBook() {

        issuedBooks++;
        totalIssued + 1;

    }

    public void issueBook(int quantity) {

        issuedBooks = issuedBooks + quantity
        totalIssued = totalIssued + quantity;

    }

    public int getIssuedBooks() {
        return issuedbooks;
    }


    public static void main(String args[]) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String n1 = sc.next();
        String n2 = sc.next();
        int q1 = sc.nextInt();
        int q2 = sc.nextInt();

        Library l1 = new Library(n1);
        Library l2 = new Library(n2);

        l1.issueBook();
        l1.issueBook(q1);
        l2.issueBook(q2);

        System.out.println("Books issued from l1: " + l1.getIssuedBooks());
        System.out.println("Total books issued: " + totalIssued);
    }

}`,
        python: `class Library:
    total_issued = 0

    def __init__(self, name):
        self.book_name = name
        self.issued_books = 0

    def issue_book(self, quantity=1):
        issued_books = issued_books + quantity
        total_issued = total_issued + quantity

    def get_issued_books(self):
        return issued_books

if __name__ == "__main__":
    line = input().split()
    n1 = line[0]
    n2 = line[1]
    q1 = int(line[2])
    q2 = int(line[3])

    l1 = Library(n1)
    l2 = Library(n2)

    l1.issue_book()
    l1.issue_book(q1)
    l2.issue_book(q2)

    print("Books issued from l1: " + str(l1.get_issued_books()))
    print("Total books issued: " + str(Library.total_issued))`,
        "c++": `#include <iostream>
#include <string>
using namespace std;

class Library {
    string bookName;
    int issuedBooks;
    
public:
    static int totalIssued;

    Library(string name) {
        bookName = name;
        issuedBooks = 0;
    }

    void issueBook() {
        issuedBooks++;
        totalIssued++;
    }

    // Overloading
    void issueBook(int quantity) {
        issuedBooks += quantity;
        totalIssued += quantity;
    }

    int getIssuedBooks() {
        return issuedBooks;
    }
};

int main() {
    string n1, n2;
    int q1, q2;
    cin >> n1 >> n2 >> q1 >> q2;

    Library l1(n1);
    Library l2(n2);

    l1.issueBook();
    l1.issueBook(q1);
    l2.issueBook(q2);

    cout << "Books issued from l1: " << l1.getIssuedBooks() << endl;
    cout << "Total books issued: " << Library::totalIssued << endl;

    return 0;
}`,
        javascript: `class Library {
  static totalIssued = 0;

  constructor(name) {
    this.bookName = name;
    this.issuedBooks = 0;
  }

  issueBook(quantity = 1) {
    issuedBooks = issuedBooks + quantity;
    totalIssued = totalIssued + quantity;
  }

  getIssuedBooks() {
    return issuedBooks;
  }
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/);

const n1 = input[0];
const n2 = input[1];
const q1 = Number(input[2]);
const q2 = Number(input[3]);

const l1 = new Library(n1);
const l2 = new Library(n2);

l1.issueBook();
l1.issueBook(q1);
l2.issueBook(q2);

console.log("Books issued from l1: " + l1.getIssuedBooks());
console.log("Total books issued: " + Library.totalIssued);`
      },
      timeLimit: 900,
      testCases: {
        create: [
          { 
            input: "Java OS 2 3", 
            expected: `Books issued from l1: 3
Total books issued: 6`, 
            isHidden: false 
          },
          { 
            input: "CPP Python 5 5", 
            expected: `Books issued from l1: 6
Total books issued: 11`, 
            isHidden: false 
          },
          { 
            input: "React Node 10 20", 
            expected: `Books issued from l1: 11
Total books issued: 31`, 
            isHidden: false 
          },
        ],
      },
    },
  });

  // ── Round 3: MVP Problem Statements ──

  await prisma.problem.deleteMany({ where: { roundNumber: 3 } });

  await prisma.problem.create({
    data: {
      title: "Smart Mission Planner",
      description: `Problem Statement:
You are building Smart Mission Planner, a productivity-first planning app that helps users turn ambitious goals into practical, executable action plans.

Objective:
Break complex tasks into smaller, manageable steps.

Detailed Explanation:
Users should be able to enter one large mission (for example: "Prepare for internship interviews in 30 days") and the system should intelligently split it into structured subtasks.
Each subtask should include:
- A clear title
- Priority level (High / Medium / Low)
- Recommended or user-editable deadline
- Completion status

The app should help users avoid overwhelm by making large goals feel achievable through progressive execution.

Key Features:
1) Task Breakdown
- Convert one major goal into multiple subtasks.
- Allow users to add, edit, merge, or delete generated subtasks.

2) Priority Assignment
- Assign priority labels to each subtask.
- Support sorting/filtering by priority.

3) Deadline Tracking
- Set deadlines for each subtask.
- Show upcoming and overdue items clearly.

4) Progress Monitoring
- Track completion status per subtask.
- Display mission progress with percentage and visual indicator.

Expected MVP Scope:
- Functional interface for creating one or more missions.
- Auto-generated or template-based subtask suggestions.
- Priority and deadline management for all subtasks.
- Basic progress dashboard for mission completion.

Evaluation Focus:
- Clarity of task decomposition
- Usability and workflow simplicity
- Quality of progress visibility`,
      difficulty: "Hard",
      roundNumber: 3,
      timeLimit: 2700,
    },
  });

  await prisma.problem.create({
    data: {
      title: "Focus Arena: Distraction Killer",
      description: `Problem Statement:
Build Focus Arena, an application designed to improve concentration by reducing digital distractions and building consistent focus habits.

Objective:
Improve user focus.

Detailed Explanation:
Modern students lose productivity due to constant interruptions from social media and random browsing.
This app should help users stay on task by combining distraction blocking, structured focus sessions (Pomodoro), and measurable productivity analytics.

Key Features:
1) Distraction Blocking
- Allow users to define a custom blocklist (e.g., social media domains/apps).
- Prevent or discourage access during active focus sessions.
- Show clear feedback when a distraction is blocked.

2) Focus Timer
- Provide Pomodoro-style timers (e.g., 25-minute focus, 5-minute break).
- Support start, pause, resume, and reset controls.
- Show session state and remaining time in real-time.

3) Productivity Tracking
- Record number of sessions completed, total focus time, and interruptions.
- Maintain daily and weekly productivity snapshots.

4) Reports
- Generate simple visual reports (charts/cards/tables).
- Highlight trends such as most productive hours and consistency streaks.

Expected MVP Scope:
- Blocklist management + active session blocker behavior.
- Fully working Pomodoro timer flow.
- Local productivity data collection.
- Basic reporting dashboard.

Evaluation Focus:
- Effectiveness of the focus workflow
- Reliability of timer and tracking logic
- Usefulness and readability of productivity reports`,
      difficulty: "Hard",
      roundNumber: 3,
      timeLimit: 2700,
    },
  });

  await prisma.problem.create({
    data: {
      title: "Skill Swap Marketplace",
      description: `Problem Statement:
Create Skill Swap Marketplace, a student-to-student platform where users exchange skills instead of money.

Objective:
Enable skill exchange among students.

Detailed Explanation:
Students often have valuable skills to teach (coding, design, communication, math, video editing, etc.) while seeking help in other areas.
This platform should let users publish what they can teach and what they want to learn, then help them discover compatible peers for reciprocal exchange.

Key Features:
1) Skill Listing
- User can create profile entries for:
  - Skills they can teach
  - Skills they want to learn
- Support categories/tags for easier discovery.

2) Matching System
- Suggest matches based on teach/learn complementarity.
- Provide a shortlist of high-fit exchange partners.

3) Ratings and Reviews
- After a session, users can rate each other.
- Show review summaries to build trust and quality.

4) User Profiles
- Public profile with bio, skill tags, availability, and ratings.
- Include basic identity details needed for collaboration.

Expected MVP Scope:
- User onboarding/profile creation.
- Add/edit/remove teach and learn skills.
- Basic matching logic and match feed.
- Simple rating/review mechanism.

Evaluation Focus:
- Match quality and practical usability
- Profile clarity and trust-building features
- End-to-end experience from listing to exchange`,
      difficulty: "Hard",
      roundNumber: 3,
      timeLimit: 2700,
    },
  });

  const round1Count = await prisma.problem.count({ where: { roundNumber: 1 } });
  const round2ProblemCount = await prisma.problem.count({ where: { roundNumber: 2 } });
  const round3Count = await prisma.problem.count({ where: { roundNumber: 3 } });

  console.log("Seed complete.");
  console.log("  Admin: admin@gdg.local / Admin@123");
  console.log(`  Round 1 debugging problems: ${round1Count}`);
  console.log(`  Round 2 DSA problems: ${round2ProblemCount} (base IDs: ${p1.id}, ${p2.id}, ${p3.id})`);
  console.log(`  Round 3 MVP problems: ${round3Count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    if (error instanceof Error && error.message.includes("P1001")) {
      console.error("[seed] Could not reach Supabase/Postgres.");
      console.error("[seed] Check DATABASE_URL host, password, and port (Supabase pooler usually uses 6543).");
    }
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
