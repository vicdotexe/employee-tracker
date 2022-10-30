class BusinessDatabase{
    constructor (){
    }

    initialize(mysqlPromiseDb){
        this.db = mysqlPromiseDb;
    }

    async getDepartments(){
        return await this.query('SELECT * FROM departments')
    }

    async getDepartmentsFancy(){
        return await this.query(`SELECT
        id AS ID,
        name AS Department
        FROM departments`);
    }

    async getRoles(){
        return await this.query('SELECT * FROM roles');
    }

    async getRolesFancy(){
        return await this.query(`SELECT 
        roles.id as ID,
        title AS Title, 
        salary AS Salary, 
        departments.name AS Department 
        FROM roles 
        LEFT JOIN departments on roles.department_id = departments.id`);
    }

    async getEmployees(){
        return await this.query('SELECT * FROM employees');
    }

    async getEmployeesFancy(){
        return await this.query(`SELECT 
        employees.id AS ID,
        CONCAT(employees.first_name, ' ', employees.last_name) AS Name,
        roles.title AS Title, 
        roles.salary AS Salary,
        departments.name AS Department,
        CONCAT(manager.first_name, ' ', manager.last_name) AS Manager
        FROM employees 
        LEFT JOIN roles ON roles.id = role_id
        LEFT JOIN departments ON roles.department_id = departments.id
        LEFT JOIN employees AS Manager ON employees.manager_id = manager.id`);
    }

    async getEmployeesFromDepartment(departmentId){
        return await this.query('SELECT * FROM employees WHERE employees.role_id IN (SELECT id FROM roles WHERE department_id = ?)',[departmentId]);
    }

    async addDepartment(deptName){
        await this.query(`INSERT INTO departments (name) VALUES (?)`,[deptName]);
    }

    async addRole(title, salary, departmentId){
        await this.query(`INSERT INTO roles (title,salary,department_id) VALUES (?, ?, ?)`, [title,salary,departmentId]);
    }

    async addEmployee(firstName, lastName, roleId, managerId){
        await this.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`,[firstName,lastName,roleId,managerId||null]);
    }

    async updateEmployeeRole(employeeId, roleId){
        await this.query('UPDATE employees SET role_id = ? WHERE id = ?', [roleId, employeeId]);
    }

    async updateEmployeeManager(employeeId, managerId){
        await this.query('UPDATE employees SET manager_id = ? WHERE id = ?', [managerId, employeeId]);
    }

    async query(query,sanitize){
        try{
            let [rows] = await this.db.query(query,sanitize);
            return rows;
        }catch(err){
            console.log(err);
            return {error: err}
        }
    }
}

module.exports = BusinessDatabase;