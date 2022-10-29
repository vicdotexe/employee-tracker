const mysql = require('mysql2/promise');
const BusinessDatabase = require('./lib/business');
const db = new BusinessDatabase();

async function main(){
    let connection = await mysql.createConnection(  {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'business_db'
      });
      
    db.initialize(connection);

    let deps = await db.getDepartments();
    let roles = await db.getRoles();
    let employees = await db.getEmployees();

    console.table(deps);
    console.table(roles);
    console.table(employees);
}

main();