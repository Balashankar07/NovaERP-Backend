using System;
using Npgsql;

class Program {
    static void Main() {
        var connString = "Host=localhost;Port=5432;Database=NovaERPDB;Username=postgres;Password=balan123";
        using var conn = new NpgsqlConnection(connString);
        conn.Open();
        
        Console.WriteLine("--- CHECKING USERS ---");
        using var cmd1 = new NpgsqlCommand("SELECT \"Id\", \"Email\" FROM \"Users\" WHERE \"Email\" = 'admin@novaerp.com'", conn);
        using var reader1 = cmd1.ExecuteReader();
        string adminId = null;
        while(reader1.Read()) {
            adminId = reader1.GetGuid(0).ToString();
            Console.WriteLine("Admin ID: " + adminId + " Email: " + reader1.GetString(1));
        }
        reader1.Close();

        if (adminId == null) {
            Console.WriteLine("Admin user not found!");
            return;
        }

        Console.WriteLine("--- CHECKING USERROLES ---");
        using var cmd2 = new NpgsqlCommand("SELECT \"Id\", \"UserId\", \"RoleId\" FROM \"UserRoles\" WHERE \"UserId\" = '" + adminId + "'", conn);
        using var reader2 = cmd2.ExecuteReader();
        string roleId = null;
        while(reader2.Read()) {
            roleId = reader2.GetGuid(2).ToString();
            Console.WriteLine("UserRole Id: " + reader2.GetGuid(0) + " UserId: " + reader2.GetGuid(1) + " RoleId: " + roleId);
        }
        reader2.Close();

        if (roleId == null) {
            Console.WriteLine("No roles assigned to admin!");
            return;
        }

        Console.WriteLine("--- CHECKING ROLE ---");
        using var cmd3 = new NpgsqlCommand("SELECT \"Id\", \"Name\" FROM \"Roles\" WHERE \"Id\" = '" + roleId + "'", conn);
        using var reader3 = cmd3.ExecuteReader();
        while(reader3.Read()) {
            Console.WriteLine("Role Id: " + reader3.GetGuid(0) + " Name: " + reader3.GetString(1));
        }
        reader3.Close();

        Console.WriteLine("--- CHECKING ROLEPERMISSIONS COUNT ---");
        using var cmd4 = new NpgsqlCommand("SELECT COUNT(*) FROM \"RolePermissions\" WHERE \"RoleId\" = '" + roleId + "'", conn);
        Console.WriteLine("Permissions Count: " + cmd4.ExecuteScalar());
    }
}
