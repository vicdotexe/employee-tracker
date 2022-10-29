class BusinessDatabase{
    constructor (){
    }

    initialize(mysqlPromiseDb){
        this.db = mysqlPromiseDb;
    }

    async getDepartments(){
        return await this.query('SELECT * FROM departments')
    }

    async getRoles(){
        return await this.query('SELECT * FROM roles');
    }

    async getEmployees(){
        return await this.query('SELECT * FROM employees');
    }

    async addDepartment(deptName){
        await this.query(`INSERT INTO departments (name) VALUES ("${deptName}")`);
    }

    async addRole(title, salary, departmentId){
        await this.query(`INSERT INTO roles (title,salary,department_id) VALUES ("${title}", ${salary}, ${departmentId})`);
    }

    async addEmployee(firstName, lastName, roleId, managerId){
        await this.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ("${firstName}", "${lastName}", ${roleId}, ${managerId || null})`);
    }

    async updateEmployeeRole(employeeId, roleId){
        await this.db.execute('UPDATE employees SET role_id = ? WHERE id = ?', [roleId, employeeId]);
    }

    async query(query){
        try{
            let [rows] = await this.db.query(query);
            return rows;
        }catch(err){
            console.log(err);
            return {error: err}
        }
    }
}

module.exports = BusinessDatabase;