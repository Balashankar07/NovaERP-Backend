using System;
using System.Data;
using System.Threading.Tasks;
using Npgsql;

class Program
{
    static async Task Main(string[] args)
    {
        string connString = "Host=localhost;Port=5432;Database=NovaERPDB;Username=postgres;Password=balan123";
        await using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();

        if (args.Length > 0 && args[0] == "update")
        {
            // UPDATE SCRIPT
            Console.WriteLine("Executing Update...");
            await using var tx = await conn.BeginTransactionAsync();
            try 
            {
                var updateAdmin = new NpgsqlCommand("UPDATE \"Users\" SET \"Email\" = 'balashankar07@gmail.com' WHERE \"Email\" = 'admin@novaerp.com'", conn, tx);
                int adminRows = await updateAdmin.ExecuteNonQueryAsync();
                
                var updateEmp = new NpgsqlCommand("UPDATE \"Users\" SET \"Email\" = 'balashankarspillai2027@mca.ajce.in' WHERE \"Email\" = 'employee@novaerp.com'", conn, tx);
                int empRows = await updateEmp.ExecuteNonQueryAsync();
                
                if (adminRows == 1 && empRows == 1)
                {
                    await tx.CommitAsync();
                    Console.WriteLine("Update successful.");
                }
                else
                {
                    await tx.RollbackAsync();
                    Console.WriteLine($"Rollback! AdminRows: {adminRows}, EmpRows: {empRows}");
                }
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                Console.WriteLine("Error: " + ex.Message);
            }
        }
        else if (args.Length > 0 && args[0] == "backup")
        {
            Console.WriteLine("PostgreSQL backup must be done via pg_dump. Skipping inline.");
        }
        else
        {
            // QUERY SCRIPT
            Console.WriteLine("Users:");
            await using var cmd = new NpgsqlCommand("SELECT \"Id\", \"Email\", \"FirstName\", \"LastName\", \"CompanyId\", \"IsActive\", \"PasswordHash\", \"GoogleSubjectId\" FROM \"Users\"", conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                Console.WriteLine($"Id: {reader.GetGuid(0)}");
                Console.WriteLine($"Email: {reader.GetString(1)}");
                Console.WriteLine($"Name: {reader.GetString(2)} {reader.GetString(3)}");
                Console.WriteLine($"CompanyId: {reader.GetGuid(4)}");
                Console.WriteLine($"IsActive: {reader.GetBoolean(5)}");
                Console.WriteLine($"HasPassword: {!reader.IsDBNull(6)}");
                Console.WriteLine($"GoogleSubjectId: {(reader.IsDBNull(7) ? "NULL" : reader.GetString(7))}");
                Console.WriteLine("--------------------------------");
            }
        }
    }
}
