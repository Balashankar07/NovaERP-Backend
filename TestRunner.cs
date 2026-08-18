using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NovaERP.API;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Application.Features.GoodsReceipts.DTOs;
using System.Linq;

namespace NovaERP.TestRunner
{
    class Program
    {
        static async System.Threading.Tasks.Task Main(string[] args)
        {
            var host = Program.CreateHostBuilder(args).Build();
            using var scope = host.Services.CreateScope();
            var serviceProvider = scope.ServiceProvider;

            var grnService = serviceProvider.GetRequiredService<IGoodsReceiptService>();
            
            Console.WriteLine("Resolved services. Getting a GRN...");
            var grns = await grnService.GetAllAsync(1, 10, null, null, null);
            var grn = grns.Items.FirstOrDefault(x => x.Status == "Draft");
            
            if (grn == null)
            {
                Console.WriteLine("No Draft GRN found. Create one manually or via DB.");
                return;
            }
            
            Console.WriteLine($"Found GRN: {grn.Id}");
            try 
            {
                var result = await grnService.ReceiveAsync(grn.Id);
                Console.WriteLine($"Result: {result?.Status}");
            } 
            catch(Exception ex)
            {
                Console.WriteLine($"Exception: {ex}");
            }
        }
    }
}
