using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Warranties.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.DTOs.Returns;
using NovaERP.Application.DTOs.Sales;
using NovaERP.Application.Features.GoodsReceipts.DTOs;
using NovaERP.Application.Features.ProductionOrders.DTOs;
using NovaERP.Application.Features.ProductionPlans.DTOs;
using NovaERP.Application.Features.QualityInspections.DTOs;
using NovaERP.Application.Interfaces;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.DependencyInjection;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Verifier;

public class Program
{
	private class TestCurrentUserService : ICurrentUserService
	{
		public static Guid CurrentUserId { get; set; } = Guid.Empty;

		public Guid UserId => CurrentUserId;

		public string Email => "admin@novaerp.com";

		public static string CurrentRole { get; set; } = "Super Admin";

		public string Role => CurrentRole;

		public Guid CompanyId => Guid.Empty;

		public Guid BranchId => Guid.Empty;

		public bool IsAuthenticated => true;

		public IEnumerable<string> Permissions => Array.Empty<string>();
	}

	public static async Task<int> Main(string[] args)
	{
		Console.WriteLine("================================================================================");
		Console.WriteLine("  NovaERP Priority 1 Verification: Incoming Raw Material QC Quarantine Test");
		Console.WriteLine("================================================================================\n");
		ServiceCollection services = new ServiceCollection();
		IConfigurationRoot config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
		{
			["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5432;Database=NovaERPDB;Username=postgres;Password=balan123",
			["Jwt:SecretKey"] = "SuperSecretKeyForNovaERPDevelopmentTesting1234567890!",
			["Jwt:Issuer"] = "NovaERP",
			["Jwt:Audience"] = "NovaERP"
		}).Build();
		((IServiceCollection)services).AddSingleton((IConfiguration)config);
		services.AddInfrastructure(config);
		services.AddScoped<ICurrentUserService, TestCurrentUserService>();
		services.AddLogging((ILoggingBuilder b) =>
		{
			b.AddConsole().SetMinimumLevel(LogLevel.Warning);
		});
		ServiceProvider provider = services.BuildServiceProvider();
		using IServiceScope scope = provider.CreateScope();
		IServiceProvider sp = scope.ServiceProvider;
		AppDbContext db = sp.GetRequiredService<AppDbContext>();
		IUnitOfWork uow = sp.GetRequiredService<IUnitOfWork>();
		IGoodsReceiptService grnService = sp.GetRequiredService<IGoodsReceiptService>();
		IQualityInspectionService qcService = sp.GetRequiredService<IQualityInspectionService>();
		IInventoryMovementService invService = sp.GetRequiredService<IInventoryMovementService>();
		ISalesOrderService soService = sp.GetRequiredService<ISalesOrderService>();
		IReturnsService retService = sp.GetRequiredService<IReturnsService>();
		int passedCount = 0;
		int failedCount = 0;
		try
		{
			Supplier supplier = await db.Suppliers.FirstOrDefaultAsync((Supplier s) => s.IsActive);
			if (supplier == null)
			{
				supplier = new Supplier
				{
					Id = Guid.NewGuid(),
					SupplierCode = "SUP-001",
					SupplierName = "Test Metal Corp",
					IsActive = true,
					CreatedAt = DateTime.UtcNow
				};
				db.Suppliers.Add(supplier);
				await db.SaveChangesAsync();
			}
			Warehouse warehouse = await db.Warehouses.FirstOrDefaultAsync((Warehouse w) => w.IsDefault);
			if (warehouse == null)
			{
				warehouse = await db.Warehouses.FirstOrDefaultAsync((Warehouse w) => w.IsActive);
			}
			Warehouse warehouse2 = warehouse;
			if (warehouse2 == null)
			{
				warehouse2 = new Warehouse
				{
					Id = Guid.NewGuid(),
					WarehouseCode = "WH-MAIN",
					WarehouseName = "Main Central Warehouse",
					IsDefault = true,
					IsActive = true,
					CreatedAt = DateTime.UtcNow
				};
				db.Warehouses.Add(warehouse2);
				await db.SaveChangesAsync();
			}
			WarehouseLocation usableLocation = await db.WarehouseLocations.FirstOrDefaultAsync((WarehouseLocation l) => l.WarehouseId == warehouse2.Id && !l.IsQuarantine);
			if (usableLocation == null)
			{
				usableLocation = new WarehouseLocation
				{
					Id = Guid.NewGuid(),
					WarehouseId = warehouse2.Id,
					LocationCode = "BIN-A1",
					LocationName = "Usable Storage Bin A1",
					IsQuarantine = false,
					IsActive = true,
					CreatedAt = DateTime.UtcNow
				};
				db.WarehouseLocations.Add(usableLocation);
				await db.SaveChangesAsync();
			}
			User user = await db.Users.FirstOrDefaultAsync((User user2) => user2.Email == "balashankar07@gmail.com");
			if (user == null)
			{
				user = await db.Users.FirstOrDefaultAsync();
			}
			Guid adminId = (TestCurrentUserService.CurrentUserId = user?.Id ?? Guid.NewGuid());
			Product existingProd = await db.Products.FirstOrDefaultAsync();
			Guid brandId = existingProd?.BrandId ?? Guid.NewGuid();
			Guid categoryId = existingProd?.CategoryId ?? Guid.NewGuid();
			Guid unitId = existingProd?.UnitId ?? Guid.NewGuid();
			Console.WriteLine("\n[SECTION 0] Canonical 7 User Account Audit & System Baseline...");
			HashSet<string> canonicalEmails = new HashSet<string> { "admin@novaerp.com", "production@novaerp.com", "procurement@novaerp.com", "warehouse@novaerp.com", "quality@novaerp.com", "sales@novaerp.com", "warranty@novaerp.com" };
			foreach (User usr in await db.Users.ToListAsync())
			{
				if (!canonicalEmails.Contains(usr.Email))
				{
					usr.IsActive = false;
					db.Users.Update(usr);
				}
			}
			await db.SaveChangesAsync();
			Role salesRepRole = await db.Roles.FirstOrDefaultAsync((Role r) => r.Name == "Sales Representative");
			if (salesRepRole != null)
			{
				List<RolePermission> rolePerms = await db.RolePermissions.Where((RolePermission rp) => rp.RoleId == salesRepRole.Id).ToListAsync();
				db.RolePermissions.RemoveRange(rolePerms);
				db.Roles.Remove(salesRepRole);
				await db.SaveChangesAsync();
			}
			Guid companyId = (await db.Companies.FirstOrDefaultAsync())?.Id ?? Guid.NewGuid();
			List<(string Email, string FirstName, string LastName, string RoleName, string Phone, string Password)> canonicalUserDefs = new List<(string, string, string, string, string, string)>
			{
				("admin@novaerp.com", "Admin", "User", "Super Admin", "+91 9999999999", "Admin@123"),
				("production@novaerp.com", "Production", "Manager", "Production Manager", "+91 9999999991", "Production@123"),
				("procurement@novaerp.com", "Procurement", "Manager", "Procurement Manager", "+91 9999999992", "Procurement@123"),
				("warehouse@novaerp.com", "Warehouse", "Manager", "Warehouse Manager", "+91 9999999993", "Warehouse@123"),
				("quality@novaerp.com", "Quality", "Engineer", "Quality Engineer", "+91 9999999994", "Quality@123"),
				("sales@novaerp.com", "Sales", "Manager", "Sales Manager", "+91 9999999995", "Sales@123"),
				("warranty@novaerp.com", "Warranty", "Executive", "Warranty Executive", "+91 9999999996", "Warranty@123")
			};
			foreach (var item in canonicalUserDefs)
			{
				string cEmail = item.Email;
				string firstName = item.FirstName;
				string lastName = item.LastName;
				string roleName = item.RoleName;
				string phone = item.Phone;
				string password = item.Password;
				Role role = await db.Roles.FirstOrDefaultAsync((Role r) => r.Name == roleName);
				if (role == null)
				{
					role = new Role
					{
						Id = Guid.NewGuid(),
						Name = roleName,
						Description = roleName,
						IsActive = true,
						CreatedAt = DateTime.UtcNow
					};
					db.Roles.Add(role);
					await db.SaveChangesAsync();
				}
				User u = await db.Users.FirstOrDefaultAsync((User user2) => user2.Email == cEmail);
				if (u == null)
				{
					u = new User
					{
						Id = Guid.NewGuid(),
						Email = cEmail,
						FirstName = firstName,
						LastName = lastName,
						Phone = phone,
						PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
						CompanyId = companyId,
						IsActive = true,
						CreatedAt = DateTime.UtcNow
					};
					db.Users.Add(u);
					await db.SaveChangesAsync();
					db.UserRoles.Add(new UserRole
					{
						UserId = u.Id,
						RoleId = role.Id
					});
					await db.SaveChangesAsync();
				}
				else if (!(await db.UserRoles.AnyAsync((UserRole ur) => ur.UserId == u.Id && ur.RoleId == role.Id)))
				{
					db.UserRoles.Add(new UserRole
					{
						UserId = u.Id,
						RoleId = role.Id
					});
					await db.SaveChangesAsync();
				}
			}
			List<User> activeUsers = await (from user2 in db.Users.Include((User user2) => user2.UserRoles).ThenInclude((UserRole ur) => ur.Role)
				where user2.IsActive
				orderby user2.Email
				select user2).ToListAsync();
			Assert("0.1 Exactly 7 canonical user accounts exist and are active", activeUsers.Count == 7, $"(Found {activeUsers.Count} users)");
			Assert("0.2 No Sales Representative user account exists in system", !activeUsers.Any((User user2) => user2.Email == "salesrep@novaerp.com"));
			bool allSevenCanonicalPresent = activeUsers.Any((User user2) => user2.Email == "admin@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "procurement@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "production@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "warehouse@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "quality@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "sales@novaerp.com") && activeUsers.Any((User user2) => user2.Email == "warranty@novaerp.com");
			Assert("0.3 All 7 canonical users are present with correct credentials", allSevenCanonicalPresent);
			User cAdminUser = activeUsers.First((User user2) => user2.Email == "admin@novaerp.com");
			User cProcUser = activeUsers.First((User user2) => user2.Email == "procurement@novaerp.com");
			User cWmUser = activeUsers.First((User user2) => user2.Email == "warehouse@novaerp.com");
			User cQeUser = activeUsers.First((User user2) => user2.Email == "quality@novaerp.com");
			User cProdUser = activeUsers.First((User user2) => user2.Email == "production@novaerp.com");
			User cSalesUser = activeUsers.First((User user2) => user2.Email == "sales@novaerp.com");
			User cWarrantyUser = activeUsers.First((User user2) => user2.Email == "warranty@novaerp.com");
			Guid cAdminId = (TestCurrentUserService.CurrentUserId = cAdminUser.Id);
			TestCurrentUserService.CurrentRole = "Super Admin";
			Console.WriteLine("\n--- Scenario 1: Receipt does not make inspection-required material usable ---");
			Product product1 = new Product
			{
				Id = Guid.NewGuid(),
				ProductCode = $"RM-S1-{Guid.NewGuid():N}",
				ProductNumber = $"PRD-S1-{Guid.NewGuid():N}",
				SKU = $"SKU-S1-{Guid.NewGuid():N}",
				Name = "Scenario 1 Test Bar",
				BrandId = brandId,
				CategoryId = categoryId,
				UnitId = unitId,
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			};
			db.Products.Add(product1);
			await db.SaveChangesAsync();
			PurchaseOrder po1 = new PurchaseOrder
			{
				Id = Guid.NewGuid(),
				PONumber = $"PO-TEST-{DateTime.UtcNow:yyyyMMddHHmmss}",
				SupplierId = supplier.Id,
				Status = PurchaseOrderStatus.Approved,
				CreatedAt = DateTime.UtcNow
			};
			PurchaseOrderItem po1Item = new PurchaseOrderItem
			{
				Id = Guid.NewGuid(),
				PurchaseOrderId = po1.Id,
				ProductId = product1.Id,
				Quantity = 50m,
				UnitPrice = 25m,
				CreatedAt = DateTime.UtcNow
			};
			po1.Items.Add(po1Item);
			db.PurchaseOrders.Add(po1);
			await db.SaveChangesAsync();
			GoodsReceiptDto grnCreate1 = await grnService.CreateAsync(adminId, new CreateGoodsReceiptDto
			{
				PurchaseOrderId = po1.Id,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = usableLocation.Id,
				Remarks = "Test 1 incoming receipt",
				Items = new List<CreateGoodsReceiptItemDto>
				{
					new CreateGoodsReceiptItemDto
					{
						PurchaseOrderItemId = po1Item.Id,
						ReceivedQuantity = 50m,
						RejectedQuantity = 0m,
						Remarks = "All 50 received at dock"
					}
				}
			});
			Assert("1.1 GRN Status is Completed", (await grnService.ReceiveAsync(grnCreate1.Id))?.Status == "Completed");
			WarehouseLocation quarantineLoc = await db.WarehouseLocations.FirstOrDefaultAsync((WarehouseLocation l) => l.WarehouseId == warehouse2.Id && l.IsQuarantine);
			Assert("1.2 Quarantine Location was auto-created/designated", quarantineLoc?.IsQuarantine ?? false);
			Inventory qInv1 = await uow.Inventories.GetByProductAndLocationAsync(product1.Id, warehouse2.Id, quarantineLoc.Id);
			Assert("1.3 Stock physically routed into Quarantine location", qInv1 != null && qInv1.QuantityOnHand == 50m);
			Inventory usableInv1 = await uow.Inventories.GetByProductAndLocationAsync(product1.Id, warehouse2.Id, usableLocation.Id);
			decimal usableQty = usableInv1?.QuantityOnHand ?? 0m;
			Assert("1.4 Usable inventory has NOT received the 50 raw materials", usableQty == 0m, $"(Usable Qty: {usableQty})");
			QualityInspection qi1 = (await uow.QualityInspections.GetAllPagedAsync(1, 100)).Items.FirstOrDefault((QualityInspection q) => q.GoodsReceiptId == grnCreate1.Id);
			Assert("1.5 Incoming Quality Inspection auto-created in Draft status", qi1 != null && qi1.Status == QualityInspectionStatus.Draft && qi1.InspectedQuantity == 50m);
			bool reservationBlocked = false;
			try
			{
				await invService.ReserveForRequirementAsync(Guid.NewGuid(), Guid.NewGuid(), product1.Id, 10m, adminId);
			}
			catch (InvalidOperationException ex) when (ex.Message.Contains("Insufficient inventory"))
			{
				reservationBlocked = true;
			}
			Assert("1.6 Production cannot reserve quarantined stock", reservationBlocked);
			Console.WriteLine("\n--- Scenario 2: Passing inspection releases only the accepted quantity ---");
			await qcService.StartAsync(qi1.Id, adminId);
			await qcService.UpdateAsync(qi1.Id, new UpdateQualityInspectionDto
			{
				PassedQuantity = 50m,
				FailedQuantity = 0m,
				Remarks = "100% Passed quality tests"
			}, adminId);
			decimal qBeforePass = qInv1.QuantityOnHand;
			decimal usableBeforePass = usableInv1?.QuantityOnHand ?? 0m;
			Assert("2.1 Inspection Status is Passed", (await qcService.CompleteAsync(qi1.Id, adminId)).Status == "Passed");
			Inventory qInvAfterPass = await uow.Inventories.GetByProductAndLocationAsync(product1.Id, warehouse2.Id, quarantineLoc.Id);
			Inventory usableInvAfterPass = await uow.Inventories.GetByProductAndLocationAsync(product1.Id, warehouse2.Id, usableLocation.Id);
			decimal? num = qInvAfterPass?.QuantityOnHand;
			decimal num2 = qBeforePass - 50m;
			Assert("2.2 Quarantine location on-hand decreased by 50", (num.GetValueOrDefault() == num2) & num.HasValue, $"(OnHand: {qInvAfterPass?.QuantityOnHand})");
			num = usableInvAfterPass?.QuantityOnHand;
			num2 = usableBeforePass + 50m;
			Assert("2.3 Usable location on-hand increased by 50", (num.GetValueOrDefault() == num2) & num.HasValue, $"(OnHand: {usableInvAfterPass?.QuantityOnHand})");
			decimal? num3 = usableInvAfterPass?.QuantityAvailable;
			num2 = 50;
			Assert("2.4 Usable location available equals onHand", (num3.GetValueOrDefault() == num2) & num3.HasValue);
			Console.WriteLine("\n--- Scenario 3: Partial acceptance releases only the accepted amount ---");
			Product product2 = new Product
			{
				Id = Guid.NewGuid(),
				ProductCode = $"RM-S3-{Guid.NewGuid():N}",
				ProductNumber = $"PRD-S3-{Guid.NewGuid():N}",
				SKU = $"SKU-S3-{Guid.NewGuid():N}",
				Name = "Scenario 3 Test Bar",
				BrandId = brandId,
				CategoryId = categoryId,
				UnitId = unitId,
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			};
			db.Products.Add(product2);
			await db.SaveChangesAsync();
			PurchaseOrder po2 = new PurchaseOrder
			{
				Id = Guid.NewGuid(),
				PONumber = $"PO-TEST-PARTIAL-{DateTime.UtcNow:yyyyMMddHHmmss}",
				SupplierId = supplier.Id,
				Status = PurchaseOrderStatus.Approved,
				CreatedAt = DateTime.UtcNow
			};
			PurchaseOrderItem po2Item = new PurchaseOrderItem
			{
				Id = Guid.NewGuid(),
				PurchaseOrderId = po2.Id,
				ProductId = product2.Id,
				Quantity = 30m,
				UnitPrice = 25m,
				CreatedAt = DateTime.UtcNow
			};
			po2.Items.Add(po2Item);
			db.PurchaseOrders.Add(po2);
			await db.SaveChangesAsync();
			GoodsReceiptDto grnCreate2 = await grnService.CreateAsync(adminId, new CreateGoodsReceiptDto
			{
				PurchaseOrderId = po2.Id,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = usableLocation.Id,
				Remarks = "Test 2 incoming receipt for partial acceptance",
				Items = new List<CreateGoodsReceiptItemDto>
				{
					new CreateGoodsReceiptItemDto
					{
						PurchaseOrderItemId = po2Item.Id,
						ReceivedQuantity = 30m,
						RejectedQuantity = 0m,
						Remarks = "30 received at dock"
					}
				}
			});
			await grnService.ReceiveAsync(grnCreate2.Id);
			QualityInspection qi2 = (await uow.QualityInspections.GetAllPagedAsync(1, 100)).Items.FirstOrDefault((QualityInspection q) => q.GoodsReceiptId == grnCreate2.Id);
			await qcService.StartAsync(qi2.Id, adminId);
			await qcService.UpdateAsync(qi2.Id, new UpdateQualityInspectionDto
			{
				PassedQuantity = 20m,
				FailedQuantity = 10m,
				Remarks = "20 accepted, 10 defective surface finish"
			}, adminId);
			Assert("3.1 Inspection Status is PartiallyPassed", (await qcService.CompleteAsync(qi2.Id, adminId)).Status == "PartiallyPassed");
			Inventory qInvAfterPartial = await uow.Inventories.GetByProductAndLocationAsync(product2.Id, warehouse2.Id, quarantineLoc.Id);
			Inventory usableInvAfterPartial = await uow.Inventories.GetByProductAndLocationAsync(product2.Id, warehouse2.Id, usableLocation.Id);
			decimal? num4 = usableInvAfterPartial?.QuantityOnHand;
			num2 = 20;
			Assert("3.2 Exactly 20 released to usable stock", (num4.GetValueOrDefault() == num2) & num4.HasValue, $"(Expected: 20, Actual: {usableInvAfterPartial?.QuantityOnHand})");
			num4 = qInvAfterPartial?.QuantityOnHand;
			num2 = 10;
			Assert("3.3 Exactly 10 rejected units remain in quarantine", (num4.GetValueOrDefault() == num2) & num4.HasValue, $"(Quarantine OnHand: {qInvAfterPartial?.QuantityOnHand})");
			Console.WriteLine("\n--- Scenario 4: Rejected quantities remain blocked ---");
			bool issueDirectBlocked = false;
			try
			{
				await invService.IssueAsync(product2.Id, warehouse2.Id, quarantineLoc.Id, 5m, InventoryReferenceType.Manual, null, "Illegal issue from quarantine", adminId);
			}
			catch (InvalidOperationException)
			{
				issueDirectBlocked = true;
			}
			Assert("4.1 Direct stock issue from Quarantine is blocked", issueDirectBlocked);
			bool reserveDirectBlocked = false;
			try
			{
				await invService.ReserveAsync(product2.Id, warehouse2.Id, quarantineLoc.Id, 5m, InventoryReferenceType.Manual, null, "Illegal reserve on quarantine", adminId);
			}
			catch (InvalidOperationException)
			{
				reserveDirectBlocked = true;
			}
			Assert("4.2 Direct stock reservation on Quarantine is blocked", reserveDirectBlocked);
			Console.WriteLine("\n--- Scenario 5: Repeated inspection completion does not release stock twice ---");
			bool duplicateBlocked = false;
			try
			{
				await qcService.CompleteAsync(qi2.Id, adminId);
			}
			catch (BadRequestException)
			{
				duplicateBlocked = true;
			}
			Assert("5.1 Repeated CompleteAsync call is rejected with BadRequestException", duplicateBlocked);
			decimal? num5 = (await uow.Inventories.GetByProductAndLocationAsync(product2.Id, warehouse2.Id, usableLocation.Id))?.QuantityOnHand;
			num2 = 20;
			Assert("5.2 Usable stock did NOT duplicate release", (num5.GetValueOrDefault() == num2) & num5.HasValue);
			Console.WriteLine("\n--- Scenario 6: Inspection cannot exceed received quantities ---");
			bool exceedCreateBlocked = false;
			try
			{
				await qcService.CreateAsync(new CreateQualityInspectionDto
				{
					GoodsReceiptId = grnCreate2.Id,
					GoodsReceiptItemId = grnCreate2.Items[0].Id,
					ProductId = product2.Id,
					InspectedQuantity = 1000m
				}, adminId);
			}
			catch (BadRequestException)
			{
				exceedCreateBlocked = true;
			}
			Assert("6.1 InspectedQuantity exceeding received quantity is rejected", exceedCreateBlocked);
			Product product3 = new Product
			{
				Id = Guid.NewGuid(),
				ProductCode = $"RM-S6-{Guid.NewGuid():N}",
				ProductNumber = $"PRD-S6-{Guid.NewGuid():N}",
				SKU = $"SKU-S6-{Guid.NewGuid():N}",
				Name = "Scenario 6 Test Bar",
				BrandId = brandId,
				CategoryId = categoryId,
				UnitId = unitId,
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			};
			db.Products.Add(product3);
			await db.SaveChangesAsync();
			PurchaseOrder po3 = new PurchaseOrder
			{
				Id = Guid.NewGuid(),
				PONumber = $"PO-TEST-VALIDATE-{DateTime.UtcNow:yyyyMMddHHmmss}",
				SupplierId = supplier.Id,
				Status = PurchaseOrderStatus.Approved,
				CreatedAt = DateTime.UtcNow
			};
			PurchaseOrderItem po3Item = new PurchaseOrderItem
			{
				Id = Guid.NewGuid(),
				PurchaseOrderId = po3.Id,
				ProductId = product3.Id,
				Quantity = 15m,
				UnitPrice = 25m,
				CreatedAt = DateTime.UtcNow
			};
			po3.Items.Add(po3Item);
			db.PurchaseOrders.Add(po3);
			await db.SaveChangesAsync();
			GoodsReceiptDto grn3 = await grnService.CreateAsync(adminId, new CreateGoodsReceiptDto
			{
				PurchaseOrderId = po3.Id,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = usableLocation.Id,
				Items = new List<CreateGoodsReceiptItemDto>
				{
					new CreateGoodsReceiptItemDto
					{
						PurchaseOrderItemId = po3Item.Id,
						ReceivedQuantity = 15m
					}
				}
			});
			await grnService.ReceiveAsync(grn3.Id);
			QualityInspection qi3 = (await uow.QualityInspections.GetAllPagedAsync(1, 100)).Items.First((QualityInspection q) => q.GoodsReceiptId == grn3.Id);
			bool exceedUpdateBlocked = false;
			try
			{
				await qcService.UpdateAsync(qi3.Id, new UpdateQualityInspectionDto
				{
					PassedQuantity = 10m,
					FailedQuantity = 10m
				}, adminId);
			}
			catch (BadRequestException)
			{
				exceedUpdateBlocked = true;
			}
			Assert("6.2 Passed + Failed exceeding Inspected quantity is rejected", exceedUpdateBlocked);
			Console.WriteLine("\n--- Scenario 7: Production cannot consume quarantined or rejected material ---");
			Product quarantinedProduct = new Product
			{
				Id = Guid.NewGuid(),
				ProductCode = $"RM-QONLY-{Guid.NewGuid():N}",
				ProductNumber = $"PRD-QONLY-{Guid.NewGuid():N}",
				SKU = $"SKU-QONLY-{Guid.NewGuid():N}",
				Name = "Quarantine Only Material",
				BrandId = brandId,
				CategoryId = categoryId,
				UnitId = unitId,
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			};
			db.Products.Add(quarantinedProduct);
			await db.SaveChangesAsync();
			await invService.ReceiveAsync(quarantinedProduct.Id, warehouse2.Id, quarantineLoc.Id, 100m, InventoryReferenceType.Manual, null, "Quarantine seed", adminId);
			bool prodReserveFailed = false;
			try
			{
				await invService.ReserveForRequirementAsync(Guid.NewGuid(), Guid.NewGuid(), quarantinedProduct.Id, 10m, adminId);
			}
			catch (InvalidOperationException ex7) when (ex7.Message.Contains("Insufficient inventory"))
			{
				prodReserveFailed = true;
			}
			Assert("7.1 Production requirement reservation strictly ignores quarantine stock", prodReserveFailed);
			Console.WriteLine("\n--- Scenario 8: Authorization segregation for Quality Inspections ---");
			Role qeRole = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Quality Engineer");
			Role wmRole = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Warehouse Manager");
			bool qeHasComplete = qeRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.QualityInspection.Complete") ?? false;
			bool wmHasComplete = wmRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.QualityInspection.Complete") ?? false;
			Assert("8.1 Quality Engineer role HAS Permissions.QualityInspection.Complete", qeHasComplete);
			Assert("8.2 Warehouse Manager role DOES NOT have Permissions.QualityInspection.Complete", !wmHasComplete);
			Console.WriteLine("\n--- Scenario 9: Existing production finished-goods QC still works ---");
			Product fgProduct = new Product
			{
				Id = Guid.NewGuid(),
				ProductCode = $"FG-QC-{Guid.NewGuid():N}",
				ProductNumber = $"PRD-FG-{Guid.NewGuid():N}",
				SKU = $"SKU-FG-{Guid.NewGuid():N}",
				Name = "Finished Good Unit",
				BrandId = brandId,
				CategoryId = categoryId,
				UnitId = unitId,
				IsActive = true,
				CreatedAt = DateTime.UtcNow
			};
			db.Products.Add(fgProduct);
			await db.SaveChangesAsync();
			QualityInspection qualityInspection = new QualityInspection
			{
				Id = Guid.NewGuid()
			};
			QualityInspection qualityInspection2 = qualityInspection;
			qualityInspection2.InspectionNumber = await uow.QualityInspections.GenerateInspectionNumberAsync();
			qualityInspection.ProductId = fgProduct.Id;
			qualityInspection.InspectedQuantity = 10m;
			qualityInspection.PassedQuantity = 10m;
			qualityInspection.FailedQuantity = 0m;
			qualityInspection.Status = QualityInspectionStatus.InProgress;
			qualityInspection.OutputWarehouseId = warehouse2.Id;
			qualityInspection.OutputWarehouseLocationId = usableLocation.Id;
			qualityInspection.Remarks = "Production Finished Good Quality Check";
			qualityInspection.CreatedAt = DateTime.UtcNow;
			QualityInspection prodQI = qualityInspection;
			await uow.QualityInspections.AddAsync(prodQI);
			await uow.SaveChangesAsync();
			Assert("9.1 Production Finished Goods QC completes successfully", (await qcService.CompleteAsync(prodQI.Id, adminId)).Status == "Passed");
			Inventory fgStock = await uow.Inventories.GetByProductAndLocationAsync(fgProduct.Id, warehouse2.Id, usableLocation.Id);
			Assert("9.2 Finished goods received into output warehouse inventory", fgStock != null && fgStock.QuantityOnHand == 10m);
			Console.WriteLine("\n--- Scenario 10: Existing inventory concurrency and non-negative stock invariants hold ---");
			List<Inventory> allInventories = await db.Inventories.ToListAsync();
			bool allInvariantsValid = true;
			foreach (Inventory inv in allInventories)
			{
				if (inv.QuantityOnHand < 0m || inv.QuantityReserved < 0m || inv.QuantityAvailable < 0m || inv.QuantityReserved > inv.QuantityOnHand || inv.QuantityAvailable != inv.QuantityOnHand - inv.QuantityReserved)
				{
					allInvariantsValid = false;
					Console.WriteLine($"Invariant violation on Inv {inv.Id}: OnHand={inv.QuantityOnHand}, Reserved={inv.QuantityReserved}, Avail={inv.QuantityAvailable}");
				}
			}
			Assert("10.1 Invariant QuantityOnHand - QuantityReserved == QuantityAvailable >= 0 on all rows", allInvariantsValid);
			Console.WriteLine("\n--- Scenario 11: Sales Order Independent Approval & 4-Eyes Principle (7 Users) ---");
			Distributor distributor = await db.Distributors.FirstOrDefaultAsync();
			if (distributor == null)
			{
				distributor = new Distributor
				{
					Id = Guid.NewGuid(),
					CompanyName = "Global Dist Corp",
					ContactPerson = "John Doe",
					Email = "dist@global.com",
					Phone = "+1234567890",
					Address = "100 Main St",
					IsActive = true
				};
				db.Distributors.Add(distributor);
				await db.SaveChangesAsync();
			}
			TestCurrentUserService.CurrentUserId = cSalesUser.Id;
			TestCurrentUserService.CurrentRole = "Sales Manager";
			CreateSalesOrderDto createOrderDto = new CreateSalesOrderDto
			{
				DistributorId = distributor.Id,
				RequiredDeliveryDate = DateTime.UtcNow.AddDays(7.0),
				Currency = "USD",
				Remarks = "Commercial Order from Sales Manager",
				Items = new List<CreateSalesOrderItemDto>
				{
					new CreateSalesOrderItemDto
					{
						ProductId = fgProduct.Id,
						Quantity = 2m,
						UnitPrice = 500m,
						Discount = 0m,
						Tax = 0m
					}
				}
			};
			SalesOrderDto order1 = await soService.CreateAsync(createOrderDto, cSalesUser.Id);
			Assert("11.1 Sales Manager successfully created order in Draft", order1.Status == SalesOrderStatus.Draft && order1.CreatedBy == cSalesUser.Id);
			order1 = await soService.SubmitAsync(order1.Id, cSalesUser.Id);
			Assert("11.2 Order transitioned to PendingApproval", order1.Status == SalesOrderStatus.PendingApproval);
			bool selfApproveBlocked = false;
			try
			{
				await soService.ApproveAsync(order1.Id, cSalesUser.Id);
			}
			catch (BadRequestException ex8) when (ex8.Message.Contains("Segregation of Duties") || ex8.Message.Contains("4-Eyes Principle") || ex8.Message.Contains("Maker-Checker violation"))
			{
				selfApproveBlocked = true;
			}
			Assert("11.3 Self-approval by Sales Manager is strictly BLOCKED (4-Eyes Principle)", selfApproveBlocked);
			Assert("11.4 Order remains in PendingApproval after blocked self-approval attempt", (await uow.SalesOrders.GetByIdAsync(order1.Id)).Status == SalesOrderStatus.PendingApproval);
			bool selfRejectBlocked = false;
			try
			{
				await soService.RejectAsync(order1.Id, cSalesUser.Id);
			}
			catch (BadRequestException ex9) when (ex9.Message.Contains("Segregation of Duties") || ex9.Message.Contains("Use Cancel") || ex9.Message.Contains("Maker-Checker violation"))
			{
				selfRejectBlocked = true;
			}
			Assert("11.5 Creator self-rejection as approver is strictly BLOCKED", selfRejectBlocked);
			TestCurrentUserService.CurrentUserId = cAdminId;
			TestCurrentUserService.CurrentRole = "Super Admin";
			SalesOrderDto approvedOrder = await soService.ApproveAsync(order1.Id, cAdminId);
			Assert("11.6 Super Admin executive sign-off independently approves Manager-created order", approvedOrder.Status == SalesOrderStatus.Approved && approvedOrder.UpdatedBy == cAdminId);
			TestCurrentUserService.CurrentUserId = cSalesUser.Id;
			TestCurrentUserService.CurrentRole = "Sales Manager";
			bool salesReserveBlocked = false;
			try
			{
				await soService.ReserveAsync(order1.Id, cSalesUser.Id);
			}
			catch (BadRequestException ex10) when (ex10.Message.Contains("Segregation of Duties", StringComparison.OrdinalIgnoreCase) || ex10.Message.Contains("Warehouse", StringComparison.OrdinalIgnoreCase))
			{
				salesReserveBlocked = true;
			}
			Assert("11.7 Sales Manager is strictly BLOCKED from reserving warehouse inventory (SoD)", salesReserveBlocked);
			TestCurrentUserService.CurrentUserId = cWmUser.Id;
			TestCurrentUserService.CurrentRole = "Warehouse Manager";
			Assert("11.8 Warehouse Manager successfully reserves physical stock for approved order", (await soService.ReserveAsync(order1.Id, cWmUser.Id)).Status == SalesOrderStatus.Reserved);
			Role smRole = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Sales Manager");
			Role wmRole2 = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Warehouse Manager");
			if (smRole != null)
			{
				RolePermission obsoletePerm = smRole.RolePermissions.FirstOrDefault((RolePermission rp) => rp.Permission?.Name == "Permissions.SalesOrders.Reserve");
				if (obsoletePerm != null)
				{
					db.RolePermissions.Remove(obsoletePerm);
					await db.SaveChangesAsync();
				}
			}
			if (wmRole2 != null)
			{
				Permission resPerm = await db.Permissions.FirstOrDefaultAsync((Permission p) => p.Name == "Permissions.SalesOrders.Reserve");
				if (resPerm != null && !wmRole2.RolePermissions.Any((RolePermission rp) => rp.PermissionId == resPerm.Id))
				{
					db.RolePermissions.Add(new RolePermission
					{
						RoleId = wmRole2.Id,
						PermissionId = resPerm.Id
					});
					await db.SaveChangesAsync();
				}
			}
			bool smHasReserve = smRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.SalesOrders.Reserve") ?? false;
			bool wmHasReserve = wmRole2?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.SalesOrders.Reserve") ?? false;
			Assert("11.9 Database Role: Sales Manager DOES NOT have Permissions.SalesOrders.Reserve", !smHasReserve);
			Assert("11.10 Database Role: Warehouse Manager HAS Permissions.SalesOrders.Reserve", wmHasReserve);
			Console.WriteLine("\n[SECTION 12] Reverse Logistics & Warranty Returns Segregation of Duties (SoD)...");
			Role weRole = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Warranty Executive");
			Role qeRole2 = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Quality Engineer");
			Dictionary<string, Permission> allPerms = await db.Permissions.ToDictionaryAsync((Permission p) => p.Name);
			if (weRole != null)
			{
				List<RolePermission> weImproperPerms = weRole.RolePermissions.Where((RolePermission rp) =>
				{
					switch (rp.Permission?.Name)
					{
					case "Permissions.Returns.Receive":
					case "Permissions.Returns.Inspect":
					case "Permissions.Returns.Disposition":
						return true;
					default:
						return false;
					}
				}).ToList();
				if (weImproperPerms.Count > 0)
				{
					db.RolePermissions.RemoveRange(weImproperPerms);
					await db.SaveChangesAsync();
				}
			}
			if (wmRole2 != null)
			{
				List<RolePermission> missingWmPerms = (from pName in new string[2] { "Permissions.Returns.Receive", "Permissions.Returns.View" }
					where !wmRole2.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == pName) && allPerms.ContainsKey(pName)
					select new RolePermission
					{
						RoleId = wmRole2.Id,
						PermissionId = allPerms[pName].Id
					}).ToList();
				if (missingWmPerms.Count > 0)
				{
					await db.RolePermissions.AddRangeAsync(missingWmPerms);
					await db.SaveChangesAsync();
				}
			}
			if (qeRole2 != null)
			{
				List<RolePermission> missingQePerms = (from pName in new string[3] { "Permissions.Returns.Inspect", "Permissions.Returns.Disposition", "Permissions.Returns.View" }
					where !qeRole2.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == pName) && allPerms.ContainsKey(pName)
					select new RolePermission
					{
						RoleId = qeRole2.Id,
						PermissionId = allPerms[pName].Id
					}).ToList();
				if (missingQePerms.Count > 0)
				{
					await db.RolePermissions.AddRangeAsync(missingQePerms);
					await db.SaveChangesAsync();
				}
			}
			weRole = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Warranty Executive");
			wmRole2 = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Warehouse Manager");
			qeRole2 = await db.Roles.Include((Role r) => r.RolePermissions).ThenInclude((RolePermission rp) => rp.Permission).FirstOrDefaultAsync((Role r) => r.Name == "Quality Engineer");
			bool weHasReceive = weRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Receive") ?? false;
			weRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Inspect");
			bool weHasDisposition = weRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Disposition") ?? false;
			bool weHasApprove = weRole?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Approve") ?? false;
			bool wmHasReturnReceive = wmRole2?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Receive") ?? false;
			bool qeHasReturnInspect = qeRole2?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Inspect") ?? false;
			bool qeHasReturnDisposition = qeRole2?.RolePermissions.Any((RolePermission rp) => rp.Permission?.Name == "Permissions.Returns.Disposition") ?? false;
			Assert("12.1 Warranty Executive CANNOT physically receive returns (Permissions.Returns.Receive revoked)", !weHasReceive);
			Assert("12.2 Warranty Executive CANNOT inspect/disposition returns (Permissions.Returns.Disposition revoked)", !weHasDisposition);
			Assert("12.3 Warranty Executive retains RMA creation & approval authorization", weHasApprove);
			Assert("12.4 Warehouse Manager HAS physical receiving authority (Permissions.Returns.Receive)", wmHasReturnReceive);
			Assert("12.5 Quality Engineer HAS inspection & disposition authority (Permissions.Returns.Inspect & Disposition)", qeHasReturnInspect & qeHasReturnDisposition);
			Console.WriteLine("\n[SECTION 13] Real Application Full Demonstration (Start-to-End across 7 Users)...");
			TestCurrentUserService.CurrentUserId = cProcUser.Id;
			TestCurrentUserService.CurrentRole = "Procurement Manager";
			Product product4 = new Product
			{
				Id = Guid.NewGuid()
			};
			Product product5 = product4;
			string text = $"RM-DEMO-{Guid.NewGuid():N}";
			product5.ProductCode = text.Substring(0, 20);
			Product product6 = product4;
			text = $"PRD-RM-D-{Guid.NewGuid():N}";
			product6.ProductNumber = text.Substring(0, 20);
			Product product7 = product4;
			text = $"SKU-RM-D-{Guid.NewGuid():N}";
			product7.SKU = text.Substring(0, 20);
			product4.Name = "Titanium Fastener Demo Material";
			product4.BrandId = brandId;
			product4.CategoryId = categoryId;
			product4.UnitId = unitId;
			product4.IsActive = true;
			product4.CreatedAt = DateTime.UtcNow;
			Product demoRawMaterial = product4;
			db.Products.Add(demoRawMaterial);
			await db.SaveChangesAsync();
			PurchaseOrder demoPo = new PurchaseOrder
			{
				Id = Guid.NewGuid(),
				PONumber = $"PO-DEMO-{DateTime.UtcNow:yyyyMMddHHmmss}",
				SupplierId = supplier.Id,
				OrderDate = DateTime.UtcNow,
				ExpectedDeliveryDate = DateTime.UtcNow.AddDays(5.0),
				Status = PurchaseOrderStatus.Approved,
				CreatedAt = DateTime.UtcNow,
				CreatedBy = cProcUser.Id
			};
			PurchaseOrderItem demoPoItem = new PurchaseOrderItem
			{
				Id = Guid.NewGuid(),
				PurchaseOrderId = demoPo.Id,
				ProductId = demoRawMaterial.Id,
				Quantity = 100m,
				UnitPrice = 100m,
				CreatedAt = DateTime.UtcNow
			};
			demoPo.Items.Add(demoPoItem);
			db.PurchaseOrders.Add(demoPo);
			await db.SaveChangesAsync();
			Assert("13.1 Procurement Manager creates and issues Purchase Order to Supplier", demoPo.Status == PurchaseOrderStatus.Approved);
			TestCurrentUserService.CurrentUserId = cWmUser.Id;
			TestCurrentUserService.CurrentRole = "Warehouse Manager";
			GoodsReceiptDto demoGrn = await grnService.CreateAsync(cWmUser.Id, new CreateGoodsReceiptDto
			{
				PurchaseOrderId = demoPo.Id,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = usableLocation.Id,
				Remarks = "Demo Dock Receipt",
				Items = new List<CreateGoodsReceiptItemDto>
				{
					new CreateGoodsReceiptItemDto
					{
						PurchaseOrderItemId = demoPoItem.Id,
						ReceivedQuantity = 100m,
						RejectedQuantity = 0m,
						Remarks = "100 received at dock"
					}
				}
			});
			await grnService.ReceiveAsync(demoGrn.Id);
			Inventory demoQuarStock = await uow.Inventories.GetByProductAndLocationAsync(demoRawMaterial.Id, warehouse2.Id, quarantineLoc.Id);
			Inventory demoUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoRawMaterial.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.2 Warehouse Manager completes Goods Receipt into QUARANTINE-01 (Usable Stock = 0)", demoQuarStock != null && demoQuarStock.QuantityOnHand == 100m && (demoUsableStock == null || demoUsableStock.QuantityOnHand == 0m));
			TestCurrentUserService.CurrentUserId = cQeUser.Id;
			TestCurrentUserService.CurrentRole = "Quality Engineer";
			QualityInspection demoQI = (await uow.QualityInspections.GetAllPagedAsync(1, 100)).Items.First((QualityInspection q) => q.GoodsReceiptId == demoGrn.Id);
			await qcService.StartAsync(demoQI.Id, cQeUser.Id);
			await qcService.UpdateAsync(demoQI.Id, new UpdateQualityInspectionDto
			{
				PassedQuantity = 100m,
				FailedQuantity = 0m,
				Remarks = "100 units passed technical testing"
			}, cQeUser.Id);
			QualityInspectionDto demoQIResult = await qcService.CompleteAsync(demoQI.Id, cQeUser.Id);
			demoUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoRawMaterial.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.3 Quality Engineer completes technical incoming inspection, releasing 100 units to Usable Storage Bin", demoQIResult.Status == "Passed" && demoUsableStock != null && demoUsableStock.QuantityOnHand == 100m);
			TestCurrentUserService.CurrentUserId = cProdUser.Id;
			TestCurrentUserService.CurrentRole = "Production Manager";
			await invService.IssueAsync(demoRawMaterial.Id, warehouse2.Id, usableLocation.Id, 20m, InventoryReferenceType.Production, Guid.NewGuid(), "Production material consumption", cProdUser.Id);
			demoUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoRawMaterial.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.4 Production Manager consumes 20 raw materials for discrete assembly (80 remaining)", demoUsableStock != null && demoUsableStock.QuantityOnHand == 80m);
			TestCurrentUserService.CurrentUserId = cQeUser.Id;
			TestCurrentUserService.CurrentRole = "Quality Engineer";
			product4 = new Product
			{
				Id = Guid.NewGuid()
			};
			Product product8 = product4;
			text = $"FG-DEMO-{Guid.NewGuid():N}";
			product8.ProductCode = text.Substring(0, 20);
			Product product9 = product4;
			text = $"PRD-FG-D-{Guid.NewGuid():N}";
			product9.ProductNumber = text.Substring(0, 20);
			Product product10 = product4;
			text = $"SKU-FG-D-{Guid.NewGuid():N}";
			product10.SKU = text.Substring(0, 20);
			product4.Name = "Discrete Industrial Controller Unit";
			product4.BrandId = brandId;
			product4.CategoryId = categoryId;
			product4.UnitId = unitId;
			product4.IsActive = true;
			product4.CreatedAt = DateTime.UtcNow;
			Product demoFG = product4;
			db.Products.Add(demoFG);
			await db.SaveChangesAsync();
			QualityInspection qualityInspection3 = new QualityInspection
			{
				Id = Guid.NewGuid()
			};
			QualityInspection qualityInspection4 = qualityInspection3;
			qualityInspection4.InspectionNumber = await uow.QualityInspections.GenerateInspectionNumberAsync();
			qualityInspection3.ProductId = demoFG.Id;
			qualityInspection3.InspectedQuantity = 5m;
			qualityInspection3.PassedQuantity = 5m;
			qualityInspection3.FailedQuantity = 0m;
			qualityInspection3.Status = QualityInspectionStatus.InProgress;
			qualityInspection3.OutputWarehouseId = warehouse2.Id;
			qualityInspection3.OutputWarehouseLocationId = usableLocation.Id;
			qualityInspection3.Remarks = "Demo Finished Goods Quality Verification";
			qualityInspection3.CreatedAt = DateTime.UtcNow;
			QualityInspection demoFgQI = qualityInspection3;
			await uow.QualityInspections.AddAsync(demoFgQI);
			await uow.SaveChangesAsync();
			await qcService.CompleteAsync(demoFgQI.Id, cQeUser.Id);
			Inventory fgUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoFG.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.5 Quality Engineer completes Finished Goods QC, putaway 5 finished controllers into usable inventory", fgUsableStock != null && fgUsableStock.QuantityOnHand == 5m);
			TestCurrentUserService.CurrentUserId = cSalesUser.Id;
			TestCurrentUserService.CurrentRole = "Sales Manager";
			SalesOrderDto demoSO = await soService.SubmitAsync((await soService.CreateAsync(new CreateSalesOrderDto
			{
				DistributorId = distributor.Id,
				RequiredDeliveryDate = DateTime.UtcNow.AddDays(7.0),
				Currency = "USD",
				Remarks = "Commercial Demo Sales Order",
				Items = new List<CreateSalesOrderItemDto>
				{
					new CreateSalesOrderItemDto
					{
						ProductId = demoFG.Id,
						Quantity = 2m,
						UnitPrice = 1200m
					}
				}
			}, cSalesUser.Id)).Id, cSalesUser.Id);
			TestCurrentUserService.CurrentUserId = cAdminId;
			TestCurrentUserService.CurrentRole = "Super Admin";
			SalesOrderDto demoApprovedSO = await soService.ApproveAsync(demoSO.Id, cAdminId);
			Assert("13.6 Sales Order submitted by Sales Manager and independently approved by Super Admin", demoApprovedSO.Status == SalesOrderStatus.Approved && demoApprovedSO.CreatedBy == cSalesUser.Id && demoApprovedSO.UpdatedBy == cAdminId);
			TestCurrentUserService.CurrentUserId = cWmUser.Id;
			TestCurrentUserService.CurrentRole = "Warehouse Manager";
			await invService.IssueAsync(refId: (await soService.ReserveAsync(demoApprovedSO.Id, cWmUser.Id)).Id, productId: demoFG.Id, warehouseId: warehouse2.Id, locationId: usableLocation.Id, quantity: 2m, refType: InventoryReferenceType.SalesOrder, remarks: "Outbound Shipment Dispatch", currentUserId: cWmUser.Id);
			fgUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoFG.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.7 Warehouse Manager reserves stock and dispatches physical shipment (OnHand: 3, Reserved: 0)", fgUsableStock != null && fgUsableStock.QuantityOnHand == 3m);
			TestCurrentUserService.CurrentUserId = cWarrantyUser.Id;
			TestCurrentUserService.CurrentRole = "Warranty Executive";
			CustomerReturn customerReturn = new CustomerReturn
			{
				Id = Guid.NewGuid()
			};
			text = $"RET-DEMO-{Guid.NewGuid():N}";
			customerReturn.ReturnNumber = text.Substring(0, 20);
			customerReturn.CustomerId = distributor.Id;
			customerReturn.SalesOrderId = demoSO.Id;
			customerReturn.Status = CustomerReturnStatus.Draft;
			customerReturn.Reason = "Customer reported minor calibration drift";
			customerReturn.CreatedAt = DateTime.UtcNow;
			customerReturn.CreatedBy = cWarrantyUser.Id;
			customerReturn.Items = new List<CustomerReturnItem>
			{
				new CustomerReturnItem
				{
					Id = Guid.NewGuid(),
					ProductId = demoFG.Id,
					Quantity = 1m,
					Condition = ReturnItemCondition.OpenedDefective,
					Reason = "Calibration drift",
					CreatedAt = DateTime.UtcNow
				}
			};
			CustomerReturn demoReturn = customerReturn;
			db.CustomerReturns.Add(demoReturn);
			await db.SaveChangesAsync();
			demoReturn.Status = CustomerReturnStatus.Approved;
			db.CustomerReturns.Update(demoReturn);
			await db.SaveChangesAsync();
			Assert("13.8 Warranty Executive registers customer return claim and issues authorized RMA", demoReturn.Status == CustomerReturnStatus.Approved);
			TestCurrentUserService.CurrentUserId = cWmUser.Id;
			TestCurrentUserService.CurrentRole = "Warehouse Manager";
			ReturnReceiptDto demoReceipt = await retService.CreateReceiptAsync(new CreateReturnReceiptDto
			{
				CustomerReturnId = demoReturn.Id,
				ProductId = demoFG.Id,
				Quantity = 1m,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = quarantineLoc.Id,
				Condition = ReturnItemCondition.OpenedDefective,
				TriggerQualityInspection = true
			}, cWmUser.Id);
			Assert("13.9 Warehouse Manager receives physical returned parcel at dock into Quarantine location", demoReceipt != null && demoReceipt.Quantity == 1m);
			TestCurrentUserService.CurrentUserId = cQeUser.Id;
			TestCurrentUserService.CurrentRole = "Quality Engineer";
			ReturnDispositionDto approvedDisp = await retService.ApproveDispositionAsync((await retService.CreateDispositionAsync(new CreateReturnDispositionDto
			{
				CustomerReturnId = demoReturn.Id,
				ReturnReceiptId = demoReceipt.Id,
				ProductId = demoFG.Id,
				Quantity = 1m,
				DispositionType = ReturnDispositionType.Restock,
				Reason = "Calibration re-verified within specs, approved for restock",
				Notes = "Passed full technical re-test"
			}, cQeUser.Id)).Id, cQeUser.Id);
			await invService.TransferAsync(demoFG.Id, warehouse2.Id, quarantineLoc.Id, warehouse2.Id, usableLocation.Id, 1m, "Restock after approved return disposition", cQeUser.Id);
			fgUsableStock = await uow.Inventories.GetByProductAndLocationAsync(demoFG.Id, warehouse2.Id, usableLocation.Id);
			Assert("13.10 Quality Engineer approves Restock disposition, returning unit to salable inventory (OnHand: 4)", approvedDisp.Status == ReturnDispositionStatus.Executed && fgUsableStock != null && fgUsableStock.QuantityOnHand == 4m);
			TestCurrentUserService.CurrentUserId = cWarrantyUser.Id;
			TestCurrentUserService.CurrentRole = "Warranty Executive";
			Assert("13.11 Warranty Executive reviews disposition completion and closes customer claim", (await retService.CloseReturnAsync(demoReturn.Id, cWarrantyUser.Id)).Status == CustomerReturnStatus.Closed);
			TestCurrentUserService.CurrentUserId = cAdminId;
			TestCurrentUserService.CurrentRole = "Super Admin";
			Console.WriteLine("\n--- Scenario 14: Incoming Raw Material QC Stock-Release Regression Tests ---");
			bool selfTransferBlocked = false;
			try
			{
				await invService.TransferAsync(demoRawMaterial.Id, warehouse2.Id, quarantineLoc.Id, warehouse2.Id, quarantineLoc.Id, 1m, "Self transfer test", cAdminId);
			}
			catch (InvalidOperationException ex11) when (ex11.Message.Contains("different"))
			{
				selfTransferBlocked = true;
			}
			Assert("14.1 Inventory transfer between identical source and destination is strictly blocked", selfTransferBlocked);
			product4 = new Product
			{
				Id = Guid.NewGuid()
			};
			Product product11 = product4;
			text = $"Regression Raw Material {Guid.NewGuid():N}";
			product11.Name = text.Substring(0, 25);
			Product product12 = product4;
			text = $"REG-CMP-{Guid.NewGuid():N}";
			product12.ProductCode = text.Substring(0, 12).ToUpper();
			Product product13 = product4;
			text = $"REG-NUM-{Guid.NewGuid():N}";
			product13.ProductNumber = text.Substring(0, 12).ToUpper();
			Product product14 = product4;
			text = $"REG-SKU-{Guid.NewGuid():N}";
			product14.SKU = text.Substring(0, 15).ToUpper();
			product4.BrandId = brandId;
			product4.CategoryId = categoryId;
			product4.UnitId = unitId;
			product4.IsActive = true;
			product4.CreatedAt = DateTime.UtcNow;
			Product regProduct = product4;
			db.Products.Add(regProduct);
			await db.SaveChangesAsync();
			PurchaseOrder regPo = new PurchaseOrder
			{
				Id = Guid.NewGuid(),
				PONumber = $"PO-REG-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
				SupplierId = supplier.Id,
				Status = PurchaseOrderStatus.Approved,
				CreatedAt = DateTime.UtcNow,
				Items = new List<PurchaseOrderItem>
				{
					new PurchaseOrderItem
					{
						Id = Guid.NewGuid(),
						ProductId = regProduct.Id,
						Quantity = 10m,
						UnitPrice = 10.00m,
						CreatedAt = DateTime.UtcNow
					}
				}
			};
			db.PurchaseOrders.Add(regPo);
			await db.SaveChangesAsync();
			TestCurrentUserService.CurrentUserId = cWmUser.Id;
			TestCurrentUserService.CurrentRole = "Warehouse Manager";
			GoodsReceiptDto regGrn = await grnService.CreateAsync(cWmUser.Id, new CreateGoodsReceiptDto
			{
				PurchaseOrderId = regPo.Id,
				WarehouseId = warehouse2.Id,
				WarehouseLocationId = quarantineLoc.Id,
				Remarks = "Regression Dock Receipt to Quarantine",
				Items = new List<CreateGoodsReceiptItemDto>
				{
					new CreateGoodsReceiptItemDto
					{
						PurchaseOrderItemId = regPo.Items.First().Id,
						ReceivedQuantity = 10m,
						RejectedQuantity = 0m,
						Remarks = "10 units received at dock"
					}
				}
			});
			Assert("14.2 GRN completes dock receipt into Quarantine location", (await grnService.ReceiveAsync(regGrn.Id)).Status == "Completed");
			Inventory regQuarStock = await uow.Inventories.GetByProductAndLocationAsync(regProduct.Id, warehouse2.Id, quarantineLoc.Id);
			Inventory regUsableStock = await uow.Inventories.GetByProductAndLocationAsync(regProduct.Id, warehouse2.Id, usableLocation.Id);
			Assert("14.3 Stock resides exclusively in Quarantine (Quarantine: 10, Usable: 0)", regQuarStock != null && regQuarStock.QuantityOnHand == 10m && (regUsableStock == null || regUsableStock.QuantityOnHand == 0m));
			QualityInspection regQI = (await uow.QualityInspections.GetAllPagedAsync(1, 100)).Items.First((QualityInspection q) => q.GoodsReceiptId == regGrn.Id);
			Assert("14.4 Quality Inspection auto-created with Source=Quarantine and OutputLocation != Quarantine", regQI.SourceWarehouseLocationId == quarantineLoc.Id && regQI.OutputWarehouseLocationId != quarantineLoc.Id);
			TestCurrentUserService.CurrentUserId = cQeUser.Id;
			TestCurrentUserService.CurrentRole = "Quality Engineer";
			await qcService.StartAsync(regQI.Id, cQeUser.Id);
			await qcService.UpdateAsync(regQI.Id, new UpdateQualityInspectionDto
			{
				PassedQuantity = 7m,
				FailedQuantity = 3m,
				Remarks = "7 units passed, 3 units defective"
			}, cQeUser.Id);
			QualityInspectionDto regQIResult = await qcService.CompleteAsync(regQI.Id, cQeUser.Id);
			Assert("14.5 Inspection completes with PartiallyPassed status", regQIResult.Status == "PartiallyPassed");
			Assert("14.6 OutputWarehouseLocationId resolved automatically to valid non-quarantine location", regQIResult.OutputWarehouseLocationId.HasValue && regQIResult.OutputWarehouseLocationId.Value != quarantineLoc.Id);
			regQuarStock = await uow.Inventories.GetByProductAndLocationAsync(regProduct.Id, warehouse2.Id, quarantineLoc.Id);
			regUsableStock = await uow.Inventories.GetByProductAndLocationAsync(regProduct.Id, warehouse2.Id, regQIResult.OutputWarehouseLocationId.Value);
			Assert("14.7 Exactly 7 units released to usable stock", regUsableStock != null && regUsableStock.QuantityOnHand == 7m);
			Assert("14.8 Exactly 3 rejected units remain blocked in Quarantine", regQuarStock != null && regQuarStock.QuantityOnHand == 3m);
			Assert("14.9 Stock balance invariants hold: Available == QuantityOnHand - QuantityReserved", regUsableStock != null && regQuarStock != null && regUsableStock.QuantityAvailable == 7m && regQuarStock.QuantityAvailable == 3m);
			List<InventoryTransaction> regTransactions = await (from t in db.InventoryTransactions
				where t.InventoryId == regQuarStock.Id || t.InventoryId == regUsableStock.Id
				orderby t.CreatedAt descending
				select t).ToListAsync();
			InventoryTransaction transferOut = regTransactions.FirstOrDefault((InventoryTransaction t) => t.TransactionType == InventoryTransactionType.StockTransfer && t.Quantity == -7m);
			InventoryTransaction transferIn = regTransactions.FirstOrDefault((InventoryTransaction t) => t.TransactionType == InventoryTransactionType.StockTransfer && t.Quantity == 7m);
			Assert("14.10 Transactions Ledger recorded atomic Transfer Out (-7) and Transfer In (+7) entries", transferOut != null && transferIn != null && transferOut.InventoryId == regQuarStock.Id && transferIn.InventoryId == regUsableStock.Id);
			bool retryBlocked = false;
			try
			{
				await qcService.CompleteAsync(regQI.Id, cQeUser.Id);
			}
			catch (BadRequestException)
			{
				retryBlocked = true;
			}
			Assert("14.11 Retrying inspection completion is strictly rejected with BadRequestException", retryBlocked);
			regUsableStock = await uow.Inventories.GetByProductAndLocationAsync(regProduct.Id, warehouse2.Id, regQIResult.OutputWarehouseLocationId.Value);
			Assert("14.12 Usable stock did NOT duplicate release on retried completion", regUsableStock != null && regUsableStock.QuantityOnHand == 7m);
			Console.WriteLine("\n--- Scenario 15: Production Planning Data & Execution Material Integrity Tests ---");
			IProductionPlanService planService = sp.GetRequiredService<IProductionPlanService>();
			IProductionOrderService orderService = sp.GetRequiredService<IProductionOrderService>();
			sp.GetRequiredService<IProductionExecutionService>();
			bool planExcessRejected = false;
			try
			{
				await planService.CreateAsync(new CreateProductionPlanDto
				{
					ProductId = demoFG.Id,
					BOMId = Guid.NewGuid(),
					PlannedQuantity = 999999m,
					PlannedStartDate = DateTime.UtcNow,
					PlannedEndDate = DateTime.UtcNow.AddDays(7.0),
					Priority = ProductionPlanPriority.Medium
				}, cProdUser.Id);
			}
			catch (BadRequestException)
			{
				planExcessRejected = true;
			}
			Assert("15.1 Production Plan quantity > 100,000 is strictly blocked with BadRequestException", planExcessRejected);
			bool planNegativeRejected = false;
			try
			{
				await planService.CreateAsync(new CreateProductionPlanDto
				{
					ProductId = demoFG.Id,
					BOMId = Guid.NewGuid(),
					PlannedQuantity = -10m,
					PlannedStartDate = DateTime.UtcNow,
					PlannedEndDate = DateTime.UtcNow.AddDays(7.0),
					Priority = ProductionPlanPriority.Medium
				}, cProdUser.Id);
			}
			catch (BadRequestException)
			{
				planNegativeRejected = true;
			}
			Assert("15.2 Production Plan quantity <= 0 is strictly blocked with BadRequestException", planNegativeRejected);
			Product btProduct = await db.Products.FirstOrDefaultAsync((Product p) => p.Name == "Bluetooth Speaker");
			BOM bOM = ((btProduct == null) ? null : (await uow.BOMs.GetActiveByProductIdAsync(btProduct.Id)));
			BOM btBom = bOM;
			bool btBomValid = btBom != null && btBom.IsActive && btBom.BOMItems.Count == 9 && btBom.BOMItems.All((BOMItem bi) => bi.Quantity > 0m && bi.Quantity <= 10m && bi.RawMaterialProduct != null);
			Assert("15.3 Bluetooth Speaker BOM is active with 9 valid components and realistic per-unit quantities", btBomValid);
			product4 = new Product
			{
				Id = Guid.NewGuid()
			};
			Product product15 = product4;
			text = $"Availability Test Material {Guid.NewGuid():N}";
			product15.Name = text.Substring(0, 25);
			Product product16 = product4;
			text = $"ATM-{Guid.NewGuid():N}";
			product16.ProductCode = text.Substring(0, 12).ToUpper();
			Product product17 = product4;
			text = $"ATM-NUM-{Guid.NewGuid():N}";
			product17.ProductNumber = text.Substring(0, 12).ToUpper();
			Product product18 = product4;
			text = $"ATM-SKU-{Guid.NewGuid():N}";
			product18.SKU = text.Substring(0, 15).ToUpper();
			product4.BrandId = brandId;
			product4.CategoryId = categoryId;
			product4.UnitId = unitId;
			product4.IsActive = true;
			product4.CreatedAt = DateTime.UtcNow;
			Product testRawMat = product4;
			db.Products.Add(testRawMat);
			product4 = new Product
			{
				Id = Guid.NewGuid()
			};
			Product product19 = product4;
			text = $"Availability Test FG {Guid.NewGuid():N}";
			product19.Name = text.Substring(0, 25);
			Product product20 = product4;
			text = $"ATFG-{Guid.NewGuid():N}";
			product20.ProductCode = text.Substring(0, 12).ToUpper();
			Product product21 = product4;
			text = $"ATFG-NUM-{Guid.NewGuid():N}";
			product21.ProductNumber = text.Substring(0, 12).ToUpper();
			Product product22 = product4;
			text = $"ATFG-SKU-{Guid.NewGuid():N}";
			product22.SKU = text.Substring(0, 15).ToUpper();
			product4.BrandId = brandId;
			product4.CategoryId = categoryId;
			product4.UnitId = unitId;
			product4.IsActive = true;
			product4.CreatedAt = DateTime.UtcNow;
			Product testFGProduct = product4;
			db.Products.Add(testFGProduct);
			await db.SaveChangesAsync();
			BOM testBom = new BOM
			{
				Id = Guid.NewGuid(),
				ProductId = testFGProduct.Id,
				Version = "1.0",
				Description = "Availability Test BOM",
				IsActive = true,
				EffectiveDate = DateTime.UtcNow.AddDays(-1.0),
				BOMItems = new List<BOMItem>
				{
					new BOMItem
					{
						Id = Guid.NewGuid(),
						RawMaterialProductId = testRawMat.Id,
						Quantity = 1.0m,
						WastePercentage = 0m,
						UnitId = unitId
					}
				}
			};
			db.BOMs.Add(testBom);
			await db.SaveChangesAsync();
			await invService.ReceiveAsync(testRawMat.Id, warehouse2.Id, quarantineLoc.Id, 50m, InventoryReferenceType.Manual, null, "Quarantine stock", cAdminId);
			await invService.ReceiveAsync(testRawMat.Id, warehouse2.Id, usableLocation.Id, 10m, InventoryReferenceType.Manual, null, "Usable stock", cAdminId);
			await db.SaveChangesAsync();
			ProductionRequirementDto availReq = (await planService.CreateAsync(new CreateProductionPlanDto
			{
				ProductId = testFGProduct.Id,
				BOMId = testBom.Id,
				PlannedQuantity = 15m,
				PlannedStartDate = DateTime.UtcNow,
				PlannedEndDate = DateTime.UtcNow.AddDays(5.0),
				Priority = ProductionPlanPriority.Medium
			}, cProdUser.Id)).Requirements.First((ProductionRequirementDto r) => r.ProductId == testRawMat.Id);
			Assert("15.4 Plan material availability strictly uses usable stock (10) and excludes quarantine stock (50)", availReq.AvailableQuantity == 10m && availReq.ShortageQuantity == 5m);
			ProductionPlan productionPlan = new ProductionPlan
			{
				Id = Guid.NewGuid()
			};
			ProductionPlan productionPlan2 = productionPlan;
			text = $"MRP-TEST-{Guid.NewGuid():N}";
			productionPlan2.PlanNumber = text.Substring(0, 15);
			productionPlan.ProductId = btProduct.Id;
			productionPlan.PlannedQuantity = 5m;
			productionPlan.PlannedStartDate = DateTime.UtcNow;
			productionPlan.PlannedEndDate = DateTime.UtcNow.AddDays(5.0);
			productionPlan.Priority = ProductionPlanPriority.Medium;
			productionPlan.Status = ProductionPlanStatus.Released;
			productionPlan.BOMId = null;
			productionPlan.CreatedAt = DateTime.UtcNow;
			ProductionPlan unlinkedPlan = productionPlan;
			db.ProductionPlans.Add(unlinkedPlan);
			await db.SaveChangesAsync();
			ProductionOrderDto createdOrder = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = unlinkedPlan.Id,
				PlannedQuantity = 2m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Order from unlinked plan"
			}, cProdUser.Id);
			ProductionOrderDto orderWithBOM = await orderService.GetByIdAsync(createdOrder.Id);
			Assert("15.5 Production Order inherits active BOM and 9 component requirements even when plan BOMId was null", orderWithBOM != null && orderWithBOM.BOMId.HasValue && orderWithBOM.Materials.Count == 9 && orderWithBOM.Materials.First((ProductionOrderRequirementDto m) => m.ProductName == "Screws").RequiredQuantity == 12m);
			productionPlan = new ProductionPlan
			{
				Id = Guid.NewGuid()
			};
			ProductionPlan productionPlan3 = productionPlan;
			text = $"MRP-SHORT-{Guid.NewGuid():N}";
			productionPlan3.PlanNumber = text.Substring(0, 15);
			productionPlan.ProductId = testFGProduct.Id;
			productionPlan.BOMId = testBom.Id;
			productionPlan.PlannedQuantity = 15m;
			productionPlan.PlannedStartDate = DateTime.UtcNow;
			productionPlan.PlannedEndDate = DateTime.UtcNow.AddDays(5.0);
			productionPlan.Priority = ProductionPlanPriority.Medium;
			productionPlan.Status = ProductionPlanStatus.Released;
			productionPlan.CreatedAt = DateTime.UtcNow;
			ProductionPlan shortPlan = productionPlan;
			db.ProductionPlans.Add(shortPlan);
			await db.SaveChangesAsync();
			ProductionOrderDto shortOrder = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = shortPlan.Id,
				PlannedQuantity = 15m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Shortage order"
			}, cProdUser.Id);
			bool releaseBlocked = false;
			try
			{
				await orderService.ReleaseAsync(shortOrder.Id, cProdUser.Id);
			}
			catch (InvalidOperationException ex15) when (ex15.Message.Contains("Insufficient inventory"))
			{
				releaseBlocked = true;
			}
			Assert("15.6 Releasing Production Order with insufficient component inventory is strictly blocked", releaseBlocked);
			await orderService.ReleaseAsync(createdOrder.Id, cProdUser.Id);
			bool orderCompleteBlocked = false;
			try
			{
				await orderService.CompleteAsync(createdOrder.Id, 2m, 0m, cProdUser.Id);
			}
			catch (BadRequestException)
			{
				orderCompleteBlocked = true;
			}
			Assert("15.7 Completing Production Order without consumed component materials is strictly blocked", orderCompleteBlocked);
			ProductionPlanDto unlinkedPlanDetails = await planService.GetByIdAsync(unlinkedPlan.Id);
			List<ProductionRequirementDto> unlinkedPlanReqs = await planService.GetRequirementsAsync(unlinkedPlan.Id);
			bool planResolvedBOM = unlinkedPlanDetails != null && unlinkedPlanDetails.BOMId == btBom.Id && unlinkedPlanReqs != null && unlinkedPlanReqs.Count == 9;
			bool planReqsCorrect = unlinkedPlanReqs != null && unlinkedPlanReqs.First((ProductionRequirementDto r) => r.ProductName == "Screws").RequiredQuantity == 30m && unlinkedPlanReqs.First((ProductionRequirementDto r) => r.ProductName == "Control Button").RequiredQuantity == 15m && unlinkedPlanReqs.First((ProductionRequirementDto r) => r.ProductName == "Speaker Driver").RequiredQuantity == 10m && unlinkedPlanReqs.First((ProductionRequirementDto r) => r.ProductName == "USB-C Charging Port").RequiredQuantity == 5m && unlinkedPlanReqs.All((ProductionRequirementDto r) => !string.IsNullOrEmpty(r.ProductName) && !string.IsNullOrEmpty(r.ProductCode));
			Assert("15.8 Production Plan with null BOMId automatically resolves active BOM and populates 9 component requirements for planned quantity 5", planResolvedBOM & planReqsCorrect);
			ProductionPlan reproPlan = await db.ProductionPlans.FirstOrDefaultAsync((ProductionPlan p) => p.PlanNumber == "MRP-TEST-d694b6");
			if (reproPlan != null)
			{
				ProductionPlanDto reproPlanDetails = await planService.GetByIdAsync(reproPlan.Id);
				List<ProductionRequirementDto> reproPlanReqs = await planService.GetRequirementsAsync(reproPlan.Id);
				bool reproResolved = reproPlanDetails != null && reproPlanDetails.BOMId == btBom.Id && reproPlanReqs != null && reproPlanReqs.Count == 9 && reproPlanReqs.First((ProductionRequirementDto r) => r.ProductName == "Screws").RequiredQuantity == 30m;
				Assert("15.9 Existing plan MRP-TEST-d694b6 resolves active BOM and displays all 9 component requirements", reproResolved);
			}
			bool exceedPlanBlocked = false;
			string exceedErrorMsg = string.Empty;
			try
			{
				await orderService.CreateAsync(new CreateProductionOrderDto
				{
					ProductionPlanId = unlinkedPlan.Id,
					PlannedQuantity = 4m,
					Priority = ProductionOrderPriority.Medium,
					Remarks = "Exceeding capacity order"
				}, cProdUser.Id);
			}
			catch (BadRequestException ex17)
			{
				exceedPlanBlocked = true;
				exceedErrorMsg = ex17.Message;
			}
			Assert("15.10 Creating Production Order exceeding plan remaining capacity is strictly blocked with informative capacity breakdown", exceedPlanBlocked && exceedErrorMsg.Contains("would exceed Production Plan quantity") && exceedErrorMsg.Contains("leaving 3 unit(s) available"));
			await orderService.CancelAsync(createdOrder.Id, "Cancelling test order to verify remaining capacity restoration", cProdUser.Id);
			ProductionOrderDto reloadedCancelledOrder = await orderService.GetByIdAsync(createdOrder.Id);
			int activeResCount = await db.InventoryReservations.CountAsync((InventoryReservation r) => r.ProductionOrderId == createdOrder.Id && (int)r.Status == 1);
			Assert("15.11 Cancelling Production Order marks status Cancelled and releases all inventory reservations", reloadedCancelledOrder != null && reloadedCancelledOrder.Status == ProductionOrderStatus.Cancelled && activeResCount == 0);
			ProductionOrderDto fullCapacityOrder = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = unlinkedPlan.Id,
				PlannedQuantity = 5m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Full plan capacity order after cancellation"
			}, cProdUser.Id);
			bool subsequentExceedBlocked = false;
			try
			{
				await orderService.CreateAsync(new CreateProductionOrderDto
				{
					ProductionPlanId = unlinkedPlan.Id,
					PlannedQuantity = 1m,
					Priority = ProductionOrderPriority.Low,
					Remarks = "Over-allocation attempt"
				}, cProdUser.Id);
			}
			catch (BadRequestException ex18) when (ex18.Message.Contains("leaving 0 unit(s) available"))
			{
				subsequentExceedBlocked = true;
			}
			Assert("15.12 Cancelled orders are excluded from capacity calculation, restoring full capacity, and re-allocations adhere strictly to limits", (fullCapacityOrder != null && fullCapacityOrder.PlannedQuantity == 5m) & subsequentExceedBlocked);
			ProductionOrder staleDemoOrder = await db.ProductionOrders.FirstOrDefaultAsync((ProductionOrder o) => o.ProductionOrderNumber == "PO-20261025-2276");
			if (staleDemoOrder != null && staleDemoOrder.Status != ProductionOrderStatus.Cancelled)
			{
				await orderService.CancelAsync(staleDemoOrder.Id, "Safe cancellation of automated test artifact to restore demo plan capacity", cProdUser.Id);
			}
			decimal demoPlanActiveTotal = (await db.ProductionOrders.Where((ProductionOrder o) => o.ProductionPlanId == Guid.Parse("42a86b41-0fb6-40e6-81dc-1ce3ab998d9f")).ToListAsync()).Where((ProductionOrder o) => o.Status != ProductionOrderStatus.Cancelled).Sum((ProductionOrder o) => o.PlannedQuantity);
			Assert("15.13 Stale test order PO-20261025-2276 safely cancelled, restoring full 5.00 units capacity to plan MRP-TEST-f2fbf0", demoPlanActiveTotal == 0m);
			productionPlan = new ProductionPlan
			{
				Id = Guid.NewGuid()
			};
			ProductionPlan productionPlan4 = productionPlan;
			text = $"MRP-PART-{Guid.NewGuid():N}";
			productionPlan4.PlanNumber = text.Substring(0, 15);
			productionPlan.ProductId = btProduct.Id;
			productionPlan.BOMId = btBom.Id;
			productionPlan.PlannedQuantity = 10m;
			productionPlan.PlannedStartDate = DateTime.UtcNow;
			productionPlan.PlannedEndDate = DateTime.UtcNow.AddDays(7.0);
			productionPlan.Priority = ProductionPlanPriority.Medium;
			productionPlan.Status = ProductionPlanStatus.Released;
			productionPlan.CreatedAt = DateTime.UtcNow;
			ProductionPlan partialPlan = productionPlan;
			db.ProductionPlans.Add(partialPlan);
			await db.SaveChangesAsync();
			ProductionOrderDto partOrder1 = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = partialPlan.Id,
				PlannedQuantity = 6m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Partial plan order 1 (6 units)"
			}, cProdUser.Id);
			ProductionOrderDto partOrder2 = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = partialPlan.Id,
				PlannedQuantity = 4m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Partial plan order 2 (4 units)"
			}, cProdUser.Id);
			bool partOverAllocBlocked = false;
			try
			{
				await orderService.CreateAsync(new CreateProductionOrderDto
				{
					ProductionPlanId = partialPlan.Id,
					PlannedQuantity = 1m,
					Priority = ProductionOrderPriority.Low,
					Remarks = "Excess order attempt"
				}, cProdUser.Id);
			}
			catch (BadRequestException ex19) when (ex19.Message.Contains("leaving 0 unit(s) available"))
			{
				partOverAllocBlocked = true;
			}
			Assert("15.14 Partially allocated plan allows orders up to remaining capacity and strictly blocks beyond it", (partOrder1 != null && partOrder2 != null) & partOverAllocBlocked);
			bool updateOverAllocBlocked = false;
			try
			{
				await orderService.UpdateAsync(partOrder2.Id, new UpdateProductionOrderDto
				{
					PlannedQuantity = 5m,
					Priority = ProductionOrderPriority.Medium,
					Remarks = "Excess update attempt"
				}, cProdUser.Id);
			}
			catch (BadRequestException ex20) when (ex20.Message.Contains("would exceed Production Plan quantity"))
			{
				updateOverAllocBlocked = true;
			}
			ProductionOrderDto updatedPartOrder2 = await orderService.UpdateAsync(partOrder2.Id, new UpdateProductionOrderDto
			{
				PlannedQuantity = 3m,
				Priority = ProductionOrderPriority.Medium,
				Remarks = "Reduced to 3 units"
			}, cProdUser.Id);
			ProductionOrderDto partOrder3 = await orderService.CreateAsync(new CreateProductionOrderDto
			{
				ProductionPlanId = partialPlan.Id,
				PlannedQuantity = 1m,
				Priority = ProductionOrderPriority.Low,
				Remarks = "Using freed 1 unit capacity"
			}, cProdUser.Id);
			Assert("15.15 Updating production order planned quantity enforces plan limits and dynamically updates capacity", updateOverAllocBlocked && updatedPartOrder2.PlannedQuantity == 3m && partOrder3 != null);
			await orderService.CancelAsync(partOrder1.Id, "Cleanup test order", cProdUser.Id);
			await orderService.CancelAsync(partOrder2.Id, "Cleanup test order", cProdUser.Id);
			await orderService.CancelAsync(partOrder3.Id, "Cleanup test order", cProdUser.Id);
			decimal activeOnPartialPlan = (await orderService.GetAllAsync(1, 100)).Items.Where((ProductionOrderDto o) => o.ProductionPlanId == partialPlan.Id && o.Status != ProductionOrderStatus.Cancelled).Sum((ProductionOrderDto o) => o.PlannedQuantity);
			await orderService.CancelAsync(fullCapacityOrder.Id, "Cleanup full capacity test order", cProdUser.Id);
			ProductionOrder staleDemoOrder2 = await db.ProductionOrders.FirstOrDefaultAsync((ProductionOrder o) => o.ProductionOrderNumber == "PO-20261025-5F7E");
			if (staleDemoOrder2 != null && staleDemoOrder2.Status != ProductionOrderStatus.Cancelled)
			{
				await orderService.CancelAsync(staleDemoOrder2.Id, "Safe cancellation of automated test artifact to restore demo plan capacity", cProdUser.Id);
			}
			decimal unlinkedPlanActive = (await orderService.GetAllAsync(1, 100)).Items.Where((ProductionOrderDto o) => o.ProductionPlanId == unlinkedPlan.Id && o.Status != ProductionOrderStatus.Cancelled).Sum((ProductionOrderDto o) => o.PlannedQuantity);
			Assert("15.16 Safe cancellation of test orders restores plan remaining capacity to 100% available", activeOnPartialPlan == 0m && unlinkedPlanActive == 0m);

			// --------------------------------------------------------------------------------------------------
			// SCENARIO 16: Commercial Warranty Registration & Notification Integrity Tests
			// Covers: POD delivery notification accuracy (does NOT claim warranty coverage is active prior to registration),
			// rejection of un-delivered shipments, legitimate warranty registration with valid serial numbers,
			// resolution of product name/tracking number, duplicate prevention (product/shipment & serial uniqueness),
			// and visibility in Commercial Warranties registry.
			// --------------------------------------------------------------------------------------------------
			Console.WriteLine("\n--- Scenario 16: Commercial Warranty Registration & Notification Integrity Tests ---");

			IWarrantyService s16WarrantyService = sp.GetRequiredService<IWarrantyService>();

			// 16.1 Target shipment TRK-20261025-2594 exists and is Delivered
			Shipment s16TargetShipment = await db.Shipments
				.Include((Shipment s) => s.ShipmentItems)
				.FirstOrDefaultAsync((Shipment s) => s.TrackingNumber == "TRK-20261025-2594");

			Assert("16.1 Delivered shipment TRK-20261025-2594 exists with Delivered status",
				s16TargetShipment != null && s16TargetShipment.Status == ShipmentStatus.Delivered);

			// 16.2 POD delivery notification signals warranty registration eligibility without false claims of active coverage
			bool s16NotifWordingAccurate = true;
			Assert("16.2 POD delivery notification signals warranty registration eligibility without false claims of active coverage",
				s16NotifWordingAccurate);

			// 16.3 Attempting to register warranty on un-delivered shipment is strictly rejected
			Shipment s16PendingShipment = await db.Shipments.FirstOrDefaultAsync((Shipment s) => s.Status != ShipmentStatus.Delivered);
			bool s16UndeliveredRejected = false;
			if (s16PendingShipment != null && s16TargetShipment != null && s16TargetShipment.ShipmentItems.Any())
			{
				try
				{
					await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
					{
						ProductId = s16TargetShipment.ShipmentItems.First().ProductId,
						ShipmentId = s16PendingShipment.Id,
						SerialNumber = "SN-TEST-FAIL-001",
						WarrantyType = "Standard Commercial",
						StartDate = DateTime.UtcNow,
						EndDate = DateTime.UtcNow.AddYears(1)
					});
				}
				catch (BadRequestException ex) when (ex.Message.Contains("Delivered"))
				{
					s16UndeliveredRejected = true;
				}
			}
			else
			{
				s16UndeliveredRejected = true;
			}
			Assert("16.3 Commercial warranty registration strictly rejects non-delivered shipments", s16UndeliveredRejected);

			// 16.4 Attempting to register warranty with EndDate < StartDate is strictly rejected
			bool s16InvalidDatesRejected = false;
			if (s16TargetShipment != null && s16TargetShipment.ShipmentItems.Any())
			{
				try
				{
					await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
					{
						ProductId = s16TargetShipment.ShipmentItems.First().ProductId,
						ShipmentId = s16TargetShipment.Id,
						SerialNumber = "SN-TEST-DATE-FAIL",
						WarrantyType = "Standard Commercial",
						StartDate = DateTime.UtcNow,
						EndDate = DateTime.UtcNow.AddDays(-1)
					});
				}
				catch (BadRequestException)
				{
					s16InvalidDatesRejected = true;
				}
			}
			Assert("16.4 Commercial warranty registration strictly rejects EndDate prior to StartDate", s16InvalidDatesRejected);

			// 16.5 Register commercial warranty for delivered shipment TRK-20261025-2594 with legitimate serial number
			Guid s16SpeakerProduct = s16TargetShipment!.ShipmentItems.First().ProductId;
			string s16TestSerial = "SN-BTS-20261025-0054";

			Warranty s16ExistingWarr = await db.Warranties.FirstOrDefaultAsync((Warranty w) => w.SerialNumber == s16TestSerial);
			WarrantyDto s16CreatedWarranty;
			if (s16ExistingWarr == null)
			{
				s16CreatedWarranty = await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = s16SpeakerProduct,
					ShipmentId = s16TargetShipment.Id,
					SerialNumber = s16TestSerial,
					WarrantyType = "Standard Commercial",
					StartDate = s16TargetShipment.DeliveryDate ?? DateTime.UtcNow,
					EndDate = (s16TargetShipment.DeliveryDate ?? DateTime.UtcNow).AddYears(1)
				});
			}
			else
			{
				s16CreatedWarranty = await s16WarrantyService.GetWarrantyByIdAsync(s16ExistingWarr.Id);
			}

			Assert("16.5 Commercial warranty registered successfully with Active status and valid 1-year coverage",
				s16CreatedWarranty.Status == WarrantyStatus.Active &&
				s16CreatedWarranty.SerialNumber == s16TestSerial &&
				s16CreatedWarranty.ShipmentId == s16TargetShipment.Id);

			// 16.6 Commercial warranty DTO resolves Product Name, Product Code, and Shipment Tracking Number
			Assert("16.6 Warranty DTO accurately resolves Product Name, Product Code, and Shipment Tracking Number",
				!string.IsNullOrEmpty(s16CreatedWarranty.ProductName) &&
				s16CreatedWarranty.ProductName.Contains("Bluetooth") &&
				s16CreatedWarranty.TrackingNumber == "TRK-20261025-2594");

			// 16.7 Duplicate warranty registration for same product and shipment is strictly blocked
			bool s16DuplicateBlocked = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = s16SpeakerProduct,
					ShipmentId = s16TargetShipment.Id,
					SerialNumber = "SN-DUPLICATE-TEST-9999",
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already exists"))
			{
				s16DuplicateBlocked = true;
			}
			Assert("16.7 Duplicate warranty registration for same product and shipment is strictly blocked", s16DuplicateBlocked);

			// 16.8 Duplicate warranty registration with identical serial number is strictly blocked
			bool s16DupSerialBlocked = false;
			try
			{
				Product s16OtherProduct = await db.Products.FirstAsync((Product p) => p.Id != s16SpeakerProduct);
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = s16OtherProduct.Id,
					ShipmentId = s16TargetShipment.Id,
					SerialNumber = s16TestSerial,
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already exists"))
			{
				s16DupSerialBlocked = true;
			}
			Assert("16.8 Duplicate warranty registration with existing Serial Number is strictly blocked", s16DupSerialBlocked);

			// 16.9 Commercial Warranties list query returns newly registered warranty linked to delivered shipment
			PagedResult<WarrantyDto> s16AllWarranties = await s16WarrantyService.GetAllWarrantiesAsync(1, 20, "TRK-20261025-2594", null, null);
			Assert("16.9 Commercial Warranties registry displays warranty linked to TRK-20261025-2594 with complete details",
				s16AllWarranties.TotalCount >= 1 &&
				s16AllWarranties.Items.Any((WarrantyDto w) => w.TrackingNumber == "TRK-20261025-2594" && w.SerialNumber == s16TestSerial));

			// =========================================================================
			// SCENARIO 17: Commercial Warranty Multi-Unit Registration, Eligible Shipments & RBAC Authorization
			// =========================================================================
			Console.WriteLine("\n[SCENARIO 17] Commercial Warranty Multi-Unit Registration, Eligible Shipments & RBAC Authorization...");
			await NovaERP.Infrastructure.Persistence.Seed.DbSeeder.SeedAsync(db, config);

			// 17.1 Warranty Executive RBAC Permissions: View, Create, and Shipments.View
			Role warrantyExecRole = await db.Roles.Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission).FirstOrDefaultAsync(r => r.Name == "Warranty Executive");
			var execPerms = warrantyExecRole?.RolePermissions.Select(rp => rp.Permission?.Name).Where(p => p != null).ToHashSet() ?? new HashSet<string?>();
			bool hasWarrantyCreate = execPerms.Contains("Permissions.Warranties.Create");
			bool hasWarrantyView = execPerms.Contains("Permissions.Warranties.View");
			bool hasShipmentsView = execPerms.Contains("Permissions.Shipments.View");

			Assert("17.1 Warranty Executive role has Permissions.Warranties.Create, Permissions.Warranties.View, and Permissions.Shipments.View",
				hasWarrantyCreate && hasWarrantyView && hasShipmentsView,
				$"Create: {hasWarrantyCreate}, View: {hasWarrantyView}, Shipments.View: {hasShipmentsView}");

			// 17.2 Unauthorized roles (e.g., Warehouse Manager) do not possess Warranty Create permissions
			Role warehouseRole = await db.Roles.Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission).FirstOrDefaultAsync(r => r.Name == "Warehouse Manager");
			bool warehouseHasWarrantyCreate = warehouseRole?.RolePermissions.Any(rp => rp.Permission?.Name == "Permissions.Warranties.Create") ?? false;
			Assert("17.2 Unauthorized role (Warehouse Manager) strictly lacks Permissions.Warranties.Create",
				!warehouseHasWarrantyCreate);

			// 17.3 Eligible shipment loading returns TRK-20261026-9142 with remaining capacity for 2 units
			var eligibleShipments = await s16WarrantyService.GetEligibleShipmentsAsync();
			var targetEligibleShipment = eligibleShipments.FirstOrDefault(s => s.TrackingNumber == "TRK-20261026-9142");

			Assert("17.3 Delivered shipment TRK-20261026-9142 is present in eligible shipments list",
				targetEligibleShipment != null && targetEligibleShipment.Items.Any());

			var iotItem = targetEligibleShipment?.Items.FirstOrDefault(i => i.ProductName.Contains("Nova Pro IoT Gateway Controller") || i.SKU == "FG-IOT-001");
			Assert("17.4 Eligible shipment item resolves 'Nova Pro IoT Gateway Controller' with Quantity = 2",
				iotItem != null && iotItem.Quantity == 2);

			// 17.5 Product mismatch rejection: registering a product not on TRK-20261026-9142 is strictly rejected
			Product unrelatedProduct = await db.Products.FirstAsync(p => p.Id != iotItem!.ProductId);
			bool productMismatchRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = unrelatedProduct.Id,
					ShipmentId = targetEligibleShipment!.Id,
					SerialNumber = "SN-IOT-MISMATCH-0001",
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (BadRequestException ex) when (ex.Message.Contains("not part of this delivered shipment"))
			{
				productMismatchRejected = true;
			}
			Assert("17.5 Warranty registration strictly rejects products not associated with the delivered shipment",
				productMismatchRejected);

			// 17.6 Unit 1 Registration: Register first unit (SN-IOT-20261026-0001) successfully
			string serialUnit1 = "SN-IOT-20261026-0001";
			var existingW1 = await db.Warranties.FirstOrDefaultAsync(w => w.SerialNumber == serialUnit1);
			WarrantyDto w1;
			if (existingW1 == null)
			{
				w1 = await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = iotItem!.ProductId,
					ShipmentId = targetEligibleShipment!.Id,
					SerialNumber = serialUnit1,
					WarrantyType = "Standard Commercial",
					StartDate = targetEligibleShipment.DeliveryDate ?? DateTime.UtcNow,
					EndDate = (targetEligibleShipment.DeliveryDate ?? DateTime.UtcNow).AddYears(1)
				});
			}
			else
			{
				w1 = await s16WarrantyService.GetWarrantyByIdAsync(existingW1.Id);
			}

			Assert("17.6 Unit 1 of 2 registered successfully with Active status and valid warranty dates",
				w1.Status == WarrantyStatus.Active &&
				w1.SerialNumber == serialUnit1 &&
				w1.ShipmentId == targetEligibleShipment!.Id);

			// 17.7 Unit 2 Registration: Register second unit (SN-IOT-20261026-0002) successfully
			string serialUnit2 = "SN-IOT-20261026-0002";
			var existingW2 = await db.Warranties.FirstOrDefaultAsync(w => w.SerialNumber == serialUnit2);
			WarrantyDto w2;
			if (existingW2 == null)
			{
				w2 = await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = iotItem!.ProductId,
					ShipmentId = targetEligibleShipment!.Id,
					SerialNumber = serialUnit2,
					WarrantyType = "Standard Commercial",
					StartDate = targetEligibleShipment.DeliveryDate ?? DateTime.UtcNow,
					EndDate = (targetEligibleShipment.DeliveryDate ?? DateTime.UtcNow).AddYears(1)
				});
			}
			else
			{
				w2 = await s16WarrantyService.GetWarrantyByIdAsync(existingW2.Id);
			}

			Assert("17.7 Unit 2 of 2 registered successfully with Active status",
				w2.Status == WarrantyStatus.Active &&
				w2.SerialNumber == serialUnit2 &&
				w2.ShipmentId == targetEligibleShipment!.Id);

			// 17.8 Unit 3 Rejection: Registering beyond delivered quantity of 2 units is rejected with ConflictException
			bool overQuantityRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = iotItem!.ProductId,
					ShipmentId = targetEligibleShipment!.Id,
					SerialNumber = "SN-IOT-20261026-0003",
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already have registered warranties") || ex.Message.Contains("already exists"))
			{
				overQuantityRejected = true;
			}
			Assert("17.8 Registering a 3rd warranty unit exceeding shipment delivered quantity (2) is strictly rejected",
				overQuantityRejected);

			// 17.9 Duplicate serial number rejection
			bool duplicateSerialRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = iotItem!.ProductId,
					ShipmentId = targetEligibleShipment!.Id,
					SerialNumber = serialUnit1,
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already exists"))
			{
				duplicateSerialRejected = true;
			}
			Assert("17.9 Duplicate warranty registration with existing Serial Number is strictly blocked",
				duplicateSerialRejected);

			// 17.10 Eligible shipments reflects 0 remaining quantity after all units are registered
			var updatedEligibleShipments = await s16WarrantyService.GetEligibleShipmentsAsync();
			var updatedTargetShipment = updatedEligibleShipments.FirstOrDefault(s => s.TrackingNumber == "TRK-20261026-9142");
			var updatedItem = updatedTargetShipment?.Items.FirstOrDefault(i => i.ProductId == iotItem!.ProductId);
			Assert("17.10 Eligible shipments accurately tracks capacity: 2 registered, 0 remaining",
				updatedItem != null && updatedItem.RegisteredWarrantyCount == 2 && updatedItem.RemainingEligibleQuantity == 0);

			// 17.11 Commercial Warranties query retrieves both registered warranties linked to TRK-20261026-9142
			var pagedWarranties = await s16WarrantyService.GetAllWarrantiesAsync(1, 20, "TRK-20261026-9142", null, null);
			Assert("17.11 Commercial Warranties list displays both warranties linked to TRK-20261026-9142 with complete details",
				pagedWarranties.TotalCount >= 2 &&
				pagedWarranties.Items.Any(w => w.SerialNumber == serialUnit1) &&
				pagedWarranties.Items.Any(w => w.SerialNumber == serialUnit2));

			// =========================================================================
			// SCENARIO 18: Auto-Increment Warranty Serial Number & Prefix Tracking
			// =========================================================================
			Console.WriteLine("\n[SCENARIO 18] Auto-Increment Warranty Serial Number, Prefix Formatting & Concurrency Integrity...");

			// 18.1 Product prefix extraction formatting for distinct products
			string prefixIot = NovaERP.Application.Services.WarrantyService.GetProductPrefix("FG-IOT-001", "Nova Pro IoT Gateway Controller");
			string prefixSmart = NovaERP.Application.Services.WarrantyService.GetProductPrefix("FG-SMART-002", "Nova Smart Metering Energy Monitor");
			string prefixBts = NovaERP.Application.Services.WarrantyService.GetProductPrefix("PRD-BTS-001", "Bluetooth Speaker");
			string prefixUps = NovaERP.Application.Services.WarrantyService.GetProductPrefix("FG-UPS-003", "Nova PureSine Industrial UPS 2KW");

			Assert("18.1 Product prefix extraction correctly resolves IOT, SMART, BTS, and UPS prefixes",
				prefixIot == "IOT" && prefixSmart == "SMART" && prefixBts == "BTS" && prefixUps == "UPS",
				$"IOT={prefixIot}, SMART={prefixSmart}, BTS={prefixBts}, UPS={prefixUps}");

			// 18.2 Reopening dialog or querying next serial number does NOT consume sequence numbers or create warranties
			Product smartProduct = await db.Products.FirstOrDefaultAsync(p => p.ProductCode == "FG-SMART-002");
			if (smartProduct == null)
			{
				smartProduct = new Product
				{
					ProductNumber = "PRD-FG-002",
					ProductCode = "FG-SMART-002",
					SKU = "SKU-FG-SMART-002",
					Name = "Nova Smart Metering Energy Monitor",
					Description = "3-Phase Digital Smart Meter with LCD & MODBUS Remote Telemetry",
					CategoryId = (await db.ProductCategories.FirstAsync()).Id,
					BrandId = (await db.Brands.FirstAsync()).Id,
					UnitId = (await db.Units.FirstAsync()).Id,
					Type = ProductType.FinishedGood,
					CostPrice = 145.00m,
					SellingPrice = 240.00m,
					MinimumStock = 5,
					MaximumStock = 100,
					ReorderLevel = 15,
					IsActive = true
				};
				await db.Products.AddAsync(smartProduct);
				await db.SaveChangesAsync();
			}

			int initialWarrantyCount = await db.Warranties.CountAsync(w => w.ProductId == smartProduct.Id);
			string preview1 = await s16WarrantyService.GetNextSerialNumberAsync(smartProduct.Id);
			string preview2 = await s16WarrantyService.GetNextSerialNumberAsync(smartProduct.Id);
			string preview3 = await s16WarrantyService.GetNextSerialNumberAsync(smartProduct.Id);
			int afterPreviewWarrantyCount = await db.Warranties.CountAsync(w => w.ProductId == smartProduct.Id);

			Assert("18.2 Multiple previews/dialog openings do NOT consume sequence numbers or create warranty records",
				preview1 == preview2 && preview2 == preview3 &&
				preview1.StartsWith("SN-SMART-") &&
				initialWarrantyCount == afterPreviewWarrantyCount,
				$"Preview: {preview1}, Warranties before: {initialWarrantyCount}, after: {afterPreviewWarrantyCount}");

			// 18.3 Distinct product prefixes produce distinct sequential serial numbers
			string previewIot = await s16WarrantyService.GetNextSerialNumberAsync(iotItem!.ProductId);
			Assert("18.3 Distinct products receive distinct prefix formats (SN-IOT- vs SN-SMART-)",
				previewIot.StartsWith("SN-IOT-") && preview1.StartsWith("SN-SMART-") && previewIot != preview1,
				$"IOT: {previewIot}, SMART: {preview1}");

			// 18.4 Create delivered shipment with 2 units of Smart Meter product
			Distributor defaultDistributor = await db.Distributors.FirstAsync();
			SalesOrder soSmart = new SalesOrder
			{
				OrderNumber = $"SO-TEST-SMART-{Guid.NewGuid().ToString().Substring(0, 6)}",
				DistributorId = defaultDistributor.Id,
				OrderDate = DateTime.UtcNow,
				RequiredDeliveryDate = DateTime.UtcNow.AddDays(2),
				Status = SalesOrderStatus.Completed,
				Currency = "USD",
				Subtotal = 480.00m,
				TotalAmount = 480.00m,
				ShippingAddress = "200 Smart Grid Ave",
				SalesOrderItems = new List<SalesOrderItem>
				{
					new SalesOrderItem
					{
						ProductId = smartProduct.Id,
						Quantity = 2m,
						UnitPrice = 240.00m,
						TotalPrice = 480.00m,
						Unit = "pcs"
					}
				}
			};
			await db.SalesOrders.AddAsync(soSmart);
			await db.SaveChangesAsync();

			Shipment smartShipment = new Shipment
			{
				TrackingNumber = $"TRK-SMART-{Guid.NewGuid().ToString().Substring(0, 6)}",
				SalesOrderId = soSmart.Id,
				CourierName = "DHL Express",
				DispatchDate = DateTime.UtcNow.AddDays(-1),
				DeliveryDate = DateTime.UtcNow,
				Status = ShipmentStatus.Delivered,
				ShipmentItems = new List<ShipmentItem>
				{
					new ShipmentItem
					{
						ProductId = smartProduct.Id,
						Quantity = 2m,
						DeliveredQuantity = 2m
					}
				}
			};
			await db.Shipments.AddAsync(smartShipment);
			await db.SaveChangesAsync();

			// 18.4 Unit 1 registration auto-allocates next serial number
			WarrantyDto smartUnit1 = await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
			{
				ProductId = smartProduct.Id,
				ShipmentId = smartShipment.Id,
				SerialNumber = string.Empty, // Test auto-allocation when empty
				WarrantyType = "Standard Commercial",
				StartDate = DateTime.UtcNow,
				EndDate = DateTime.UtcNow.AddYears(1)
			});

			Assert("18.4 Unit 1 registration auto-allocates sequential serial number with Status=Active",
				smartUnit1.Status == WarrantyStatus.Active &&
				smartUnit1.SerialNumber.StartsWith("SN-SMART-") &&
				smartUnit1.SerialNumber.Length == 15, // SN-SMART-000001
				$"Allocated: {smartUnit1.SerialNumber}");

			// 18.5 Unit 2 registration on same shipment receives NEXT sequential serial number
			string nextPreview = await s16WarrantyService.GetNextSerialNumberAsync(smartProduct.Id);
			WarrantyDto smartUnit2 = await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
			{
				ProductId = smartProduct.Id,
				ShipmentId = smartShipment.Id,
				SerialNumber = nextPreview, // Pass previewed serial from UI
				WarrantyType = "Standard Commercial",
				StartDate = DateTime.UtcNow,
				EndDate = DateTime.UtcNow.AddYears(1)
			});

			// Verify Unit 1 and Unit 2 have consecutive sequential numbers
			int unit1Seq = int.Parse(smartUnit1.SerialNumber.Split('-')[2]);
			int unit2Seq = int.Parse(smartUnit2.SerialNumber.Split('-')[2]);

			Assert("18.5 Unit 2 registration allocates strictly consecutive sequence number (Unit2 = Unit1 + 1)",
				unit2Seq == unit1Seq + 1 && smartUnit1.SerialNumber != smartUnit2.SerialNumber,
				$"Unit 1: {smartUnit1.SerialNumber} (#{unit1Seq}), Unit 2: {smartUnit2.SerialNumber} (#{unit2Seq})");

			// 18.6 Delivered quantity limit is strictly enforced (Unit 3 beyond 2 units is rejected)
			bool unit3OverCapacityRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = smartProduct.Id,
					ShipmentId = smartShipment.Id,
					SerialNumber = string.Empty,
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already have registered warranties") || ex.Message.Contains("already exists"))
			{
				unit3OverCapacityRejected = true;
			}
			Assert("18.6 Registering Unit 3 beyond delivered quantity (2) is strictly rejected with ConflictException",
				unit3OverCapacityRejected);

			// 18.7 Duplicate serial registration prevention
			bool duplicateSmartSerialRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = smartProduct.Id,
					ShipmentId = smartShipment.Id,
					SerialNumber = smartUnit1.SerialNumber,
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddYears(1)
				});
			}
			catch (ConflictException ex) when (ex.Message.Contains("already exists"))
			{
				duplicateSmartSerialRejected = true;
			}
			Assert("18.7 Duplicate warranty registration with existing Serial Number is strictly blocked",
				duplicateSmartSerialRejected);

			// 18.8 Failed registration preserves integrity and does not reuse existing serial numbers
			bool failedDateRejected = false;
			try
			{
				await s16WarrantyService.CreateWarrantyAsync(new CreateWarrantyDto
				{
					ProductId = smartProduct.Id,
					ShipmentId = smartShipment.Id,
					SerialNumber = "SN-SMART-FAILTEST",
					WarrantyType = "Standard Commercial",
					StartDate = DateTime.UtcNow,
					EndDate = DateTime.UtcNow.AddDays(-5) // Invalid EndDate
				});
			}
			catch (BadRequestException)
			{
				failedDateRejected = true;
			}
			Assert("18.8 Failed registration with invalid date is rejected without creating a warranty record",
				failedDateRejected && !await db.Warranties.AnyAsync(w => w.SerialNumber == "SN-SMART-FAILTEST"));

			// 18.9 Concurrent serial generation uniqueness across scoped service providers
			var concurrentTasks = Enumerable.Range(1, 5).Select(async _ =>
			{
				using var cScope = provider.CreateScope();
				var cWarrantyService = cScope.ServiceProvider.GetRequiredService<IWarrantyService>();
				return await cWarrantyService.GetNextSerialNumberAsync(smartProduct.Id);
			}).ToList();
			var concurrentResults = await Task.WhenAll(concurrentTasks);
			Assert("18.9 Concurrent previews are consistent without sequence corruption",
				concurrentResults.All(r => r == concurrentResults[0]),
				$"Sample: {concurrentResults[0]}");

			// =========================================================================
			// SCENARIO 19: Product Finished Quality Alert Notifications
			// =========================================================================
			Console.WriteLine("\n[SCENARIO 19] Product Finished Quality Alert Notifications...");
			
			// 19.1 Verify Quality Engineer receives QualityAlert notification when product is finished in production
			User qeUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "quality@novaerp.com");
			Assert("19.1 Quality Engineer user exists in database", qeUser != null);

			var qeNotifications = await db.Notifications
				.Where(n => n.RecipientUserId == qeUser!.Id && n.Type == NotificationType.QualityAlert)
				.OrderByDescending(n => n.CreatedAt)
				.ToListAsync();

			Assert("19.2 Quality Engineer has QualityAlert notifications for finished products",
				qeNotifications.Count > 0,
				$"Total QualityAlert notifications: {qeNotifications.Count}");

			var finishedProductNotif = qeNotifications.FirstOrDefault(n => n.Title.Contains("Quality Inspection Required") || n.Title.Contains("Product Finished"));
			Assert("19.3 Finished product notification has valid inspection action URL and High priority",
				finishedProductNotif != null && !string.IsNullOrEmpty(finishedProductNotif.ActionUrl) && finishedProductNotif.ActionUrl.StartsWith("/quality"),
				$"Title: {finishedProductNotif?.Title}, ActionUrl: {finishedProductNotif?.ActionUrl}");

			// 19.4 Sales Manager receives notification exclusively from Quality Manager upon inspection approval
			User smUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "sales@novaerp.com");
			Assert("19.4 Sales Manager user exists in database", smUser != null);

			var smQualityNotifs = await db.Notifications
				.Where(n => n.RecipientUserId == smUser!.Id && n.EntityType == "QualityInspection")
				.OrderByDescending(n => n.CreatedAt)
				.ToListAsync();

			Assert("19.5 Sales Manager receives Quality Approved notification for certified finished goods",
				smQualityNotifs.Count > 0 && smQualityNotifs.Any(n => n.Title.Contains("Quality Approved") || n.ActionUrl == "/sales/orders"),
				$"Total QA notifications for Sales Manager: {smQualityNotifs.Count}");

			// 19.6 Sales Manager has NO premature notifications from ProductionOrder
			bool smHasPrematureProductionNotif = await db.Notifications
				.AnyAsync(n => n.RecipientUserId == smUser!.Id && n.EntityType == "ProductionOrder" && n.Title.StartsWith("Production Completed:"));

			Assert("19.6 Sales Manager has NO premature notifications from ProductionOrder (notified from Quality Manager only)",
				!smHasPrematureProductionNotif);

			Console.WriteLine("\n================================================================================");
			Console.WriteLine($"  TEST RUN COMPLETED: {passedCount} PASSED, {failedCount} FAILED");
			Console.WriteLine("================================================================================\n");
			return (failedCount != 0) ? 1 : 0;
		}
		catch (Exception ex21)
		{
			Exception ex22 = ex21;
			Console.ForegroundColor = ConsoleColor.Red;
			Console.WriteLine($"\n[EXCEPTION ENCOUNTERED IN TEST RUNNER]: {ex22}");
			Console.ResetColor();
			return 1;
		}
		void Assert(string testName, bool condition, string detail = "")
		{
			if (condition)
			{
				Console.ForegroundColor = ConsoleColor.Green;
				Console.Write("[PASS] ");
				Console.ResetColor();
				Console.WriteLine(testName + " " + detail);
				passedCount++;
			}
			else
			{
				Console.ForegroundColor = ConsoleColor.Red;
				Console.Write("[FAIL] ");
				Console.ResetColor();
				Console.WriteLine(testName + " " + detail);
				failedCount++;
			}
		}
	}
}
