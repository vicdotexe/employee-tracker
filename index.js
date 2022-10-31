const mysql = require('mysql2/promise');
const prompt = require('inquirer').prompt;
const {printTable} = require('console-table-printer');

const BusinessDatabase = require('./lib/business');
const db = new BusinessDatabase();

// the root of the menu
async function askRoot(){
    console.log("----------------------------------------------");

    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to do?",
        choices: ["View", "Update", "Add", "Delete", "Quit"]
    })

    switch (ans){
        case "View":
            await promptView()
            break;
        case "Update":
            await promptUpdate();
            break;
        case "Add":
            await promptAdd();
            break;
        case "Delete":
            await promptDelete();
            break;
        case "Quit":
            db.end();
            return;
    }

    askRoot();
}

// prompt route for viewing options
async function promptView(){
    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to view?",
        choices: ["All Departments", "All Roles", "All Employees", "Employees by Manager", "Department Budgets", "Go Back"]
    })

    switch (ans){
        case "All Departments":
            printTable(await db.getDepartmentsFancy());
            break;
        case "All Roles":
            printTable(await db.getRolesFancy());
            break;
        case "All Employees":
            printTable(await db.getEmployeesFancy());
            break;
        case "Employees by Manager":
            await getEmployeesByManager();
            break;
        case "Department Budgets":
            printTable(await db.getBudgets());
            break;
    }
}

// prompt route for update options
async function promptUpdate(){
    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to update",
        choices: ["Employee's Role", "Employee's Manager", "Go Back"]
    })

    switch (ans){
        case "Employee's Role":
            await updateEmployeeRole();
            break;
        case "Employee's Manager":
            await updateEmployeeManager();
            break;
    }
}

// prompt route for add options
async function promptAdd(){
    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to add?",
        choices: ["New Employee", "New Role", "New Department", "Go Back"]
    })

    switch (ans){
        case "New Employee":
            await addEmployee();
            break;
        case "New Role":
            await addRole();
            break;
        case "New Department":
            await addDepartment();
            break;
    }
}

// prompt route for delete options
async function promptDelete(){
    const {ans} = await prompt({
        type: "list",
        name: "ans",
        message: "What would you like to Delete?",
        choices: ["An Employee", "A Role", "A Department", "Go Back"]
    })

    switch (ans){
        case "An Employee":
            await deleteEmployee();
            break;
        case "A Role":
            await deleteRole();
            break;
        case "A Department":
            await deleteDepartment();
            break;
    }
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

// prompt route for deleting a department
async function deleteDepartment(){
    const deps = await db.getDepartments();
    const depChoices = deps.map(dep=>{return{name:dep.name, value:dep.id}});
    const {depId} = await prompt({type:"list",name:"depId",message:"Which department would you like to delete?",choices:depChoices});
    db.deleteDepartment(depId);
    console.log(`The department has been deleted.`)
}

// prompt route for deleting a role
async function deleteRole(){
    const roles = await db.getRoles();
    const roleChoices = roles.map(role=>{return{name:role.title, value:role.id}});
    const {roleId} = await prompt({type:"list",name:"roleId",message:"Which role would you like to delete?",choices:roleChoices});
    db.deleteRole(roleId);
    console.log(`The role has been deleted.`)
}

// prompt route for deleting an employee
async function deleteEmployee(){
    const employees = await db.getEmployeesFancy();
    const empChoices = employees.map(emp=>{return{name:`${emp.Name} - ${emp.Title} in ${emp.Department} (id: ${emp.ID})}`, value:emp.ID}});
    const {empId} = await prompt({type:"list",name:"empId",message:"Which employee would you like to delete?",choices:empChoices});
    db.deleteEmployee(empId);
    console.log(`The employee has been deleted.`)
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
    printTable(await db.getEmployeesByManager(managerId));
}

// create the database connection and send it to the helper class, then kick off the prompts
mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'business_db'
  }, (connection)=>{
    return connection;
  }).then((connection)=>{
    db.initialize(connection);
    askRoot();
  });