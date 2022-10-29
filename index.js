const mysql = require('mysql2/promise');
const prompt = require('inquirer').prompt;

const BusinessDatabase = require('./lib/business');
const db = new BusinessDatabase();

async function askRoot(){
    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to do?",
        choices: ["View all roles", "View all employees", "View all departments", "Add a role", "Add an employee", "Update an employee's role", "Quit"]
    });
    console.log();
    switch(ans){
        case "View all roles":
            console.log("Roles:");
            console.table(await db.getRoles());
            break;
        case "View all employees":
            console.log("Employees:");
            console.table(await db.getEmployees());
            break;
        case "View all departments":
            console.log("Departments:");
            console.table(await db.getDepartments());
            break;
        case "Add a role":
            await addRole();
            break;
        case "Add an employee":
            break;
        case "Update an employee's role":
            break;
        case "Quit":
            db.db.end();
            return;
        default:
            throw new Error("Shouldn't reach this part of the switch block.");
    }
    console.log("----------------------------------------------");
    askRoot();
}

async function addRole(){
    const deps = await db.getDepartments();
    const depNames = deps.map(x=> x.name);
    const {title, salary, depName} = await prompt([
        {type: "input", name: "title", message: "What is the title of the role you want to add?"},
        {type: "input", name: "salary", message: "What is this role's salary?"},
        {type: "list", name: "depName", message: "Which department does this role belong to?", choices: depNames}
    ]);
    if (isNaN(salary)){
        console.log("!!! Salary must be a number. !!!");
        return;
    }
    const depId = deps.find(x=>x.name == depName).id;
    await db.addRole(title, salary, depId);
    console.log(`${title} added to roles.`);
}

async function main(){
    let connection = await mysql.createConnection(  {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'business_db'
      });

    db.initialize(connection);
    askRoot();
}



main();