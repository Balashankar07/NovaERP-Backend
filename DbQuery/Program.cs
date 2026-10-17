using System;
using Npgsql;
using BCrypt.Net;

class Program
{
    static void Main()
    {
        string hash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        Console.WriteLine($"Generated BCrypt Hash: {hash}");

        using var conn = new NpgsqlConnection("Host=localhost;Database=NovaERPDB;Username=postgres;Password=balan123");
        conn.Open();

        using var cmd = new NpgsqlCommand(@"UPDATE ""Users"" SET ""PasswordHash"" = @hash, ""IsActive"" = true WHERE ""Email"" = 'balashankar07@gmail.com'", conn);
        cmd.Parameters.AddWithValue("hash", hash);
        int rows = cmd.ExecuteNonQuery();

        Console.WriteLine($"Updated {rows} user record(s).");
    }
}
