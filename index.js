const mysql = require('mysql2/promise');
const prompt = require('inquirer').prompt;

const BusinessDatabase = require('./lib/business');
const db = new BusinessDatabase();

async function askRoot(){
    console.log("----------------------------------------------");

    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to do?",
        choices: ["View all roles", 
        "View all employees", 
        "View all departments", 
        "Add a department", 
        "Add a role", 
        "Add an employee", 
        "Update an employee's role", 
        "Update an employee's manager",
        "Get employee's under manager",
        "Get department budgets",
        "Quit"]
    });
    console.log();

    switch(ans){
        case "View all roles":
            console.log("Roles:");
            console.table(await db.getRolesFancy());
            break;
        case "View all employees":
            console.log("Employees:");
            console.table(await db.getEmployeesFancy());
            break;
        case "View all departments":
            console.log("Departments:");
            console.table(await db.getDepartmentsFancy());
            break;
        case "Add a department":
            await addDepartment();
            break;
        case "Add a role":
            await addRole();
            break;
        case "Add an employee":
            await addEmployee();
            break;
        case "Update an employee's role":
            await updateEmployeeRole();
            break;
        case "Update an employee's manager":
            await updateEmployeeManager();
            break;
        case "Get employee's under manager":
            await getEmployeesByManager();
            break;
        case "Get department budgets":
            console.table(await db.getBudgets());
            break;
        case "Quit":
            db.end();
            return;
        default:
            throw new Error("Shouldn't reach this part of the switch block.");
    }
    
    askRoot();
}

// prompt route for adding a department
async function addDepartment(){
    const {depName} = await prompt({type: "input",name:"depName",message:"Name of new department being added:"});
    db.addDepartment(depName);
    console.log(`Added ${depName} to the departments.`);
}

// prompt route for adding a role
async function addRole(){
    const deps = await db.getDepartments();
    const {title, salary, depId} = await prompt([
        {type: "input", name: "title", message: "What is the title of the role you want to add?"},
        {type: "input", name: "salary", message: "What is this role's salary?"},
        {type: "list", name: "depId", message: "Which department does this role belong to?", choices: deps.map(dep=> {return {name:dep.name, value:dep.id}})}
    ]);
    if (isNaN(salary)){
        console.log("!!! Salary must be a number. !!!");
        return;
    }
    await db.addRole(title, salary, depId);
    console.log(`${title} added to roles.`);
}

// prompt route for adding an employee
async function addEmployee(){
    const roles = await db.getRoles();
    const {firstName, lastName, roleId, hasManager} = await prompt([
        {type: "input", name: "firstName", message: "Employees first name:"},
        {type: "input", name: "lastName", message: "Employees last name:"},
        {type: "list", name: "roleId", message: "Employees role:", choices: roles.map(role=>{return {name:role.title, value:role.id}})},
        {type: "confirm", name: "hasManager", message: "Will the employee have a manager?"}
    ]);
    if (hasManager){
        const employees = await db.getEmployees();
        const empChoices = employees.map(emp=>{
            return {
                name: `${emp["first_name"]} ${emp["last_name"]} (id:${emp.id})`,
                value: emp.id
            }
        })
        var {managerId} = await prompt({type: "list", name:"managerId", message:"Who will their manager be?", choices: empChoices});
    }
    await db.addEmployee(firstName, lastName, roleId, managerId);
    console.log(`${firstName} ${lastName} has been added with the role of ${roles.find(role=>role.id == roleId).title}`);
}

// prompt route for updating an employee's role
async function updateEmployeeRole(){
    const roles = await db.getRoles();
    const employees = await db.getEmployees();
    const empChoices = employees.map(emp=>{
        return {
            name: `${emp["first_name"]} ${emp["last_name"]} (id: ${emp.id}, current role:${roles.find(role=>role.id == emp["role_id"]).title})`,
            value: emp.id
        }
    });
    const {employeeId, roleId} = await prompt([
        {type:"list",name:"employeeId", message:"Which employee would you like to change the role of?", choices:empChoices},
        {type:"list",name:"roleId", message:"Pick their new role:", choices: roles.map(role=>{return{name:role.title, value:role.id}})}
    ]);
    await db.updateEmployeeRole(employeeId,roleId);
    console.log(`Employee role has been updated.`);
}

// prompt route for updating an employee's manager
async function updateEmployeeManager(){
    const employees = await db.getEmployees();
    const empChoices = employees.map(emp=>{return{name:`${emp["first_name"]} ${emp["last_name"]} (id: ${emp.id})`, value: emp.id}});
    const {employeeId, managerId} = await prompt([
        {type:"list", name:"employeeId", message:"Which employee is having their manager updated?", choices:empChoices},
        {type:"list", name:"managerId", message:"Who will their manager be?", choices:[{name:"No Manager", value:null},...empChoices]}
    ]);
    await db.updateEmployeeManager(employeeId,managerId);
    console.log(`The employee's manager has been updated.`);
}

// prompt route for getting employees under a certain manager
async function getEmployeesByManager(){
    const managers = await db.getManagers();
    const mngChoices = managers.map(mng=>{return{name:`${mng.Name} - ${mng.Title} in ${mng.Department} (id: ${mng.ID})`, value:mng.ID}});
    const {managerId} = await prompt({type:"list", name:"managerId", message: "Under which manager?", choices:mngChoices});
    console.table(await db.getEmployeesByManager(managerId));
}

// main async function to initialize an async mysql connection
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