import os

file_path = "e:/Nova/NovaERP.Infrastructure/Services/InventoryMovementService.cs"

with open(file_path, "r") as f:
    content = f.read()

target = """                    await _auditLogger.LogAsync("Release", "Inventory", inventory.Id.ToString(), newValues: $"Released +{unusedQty} unused reservation for ProductionOrder {productionOrderId}");
                }
            }"""

replacement = """                    await _auditLogger.LogAsync("Release", "Inventory", inventory.Id.ToString(), newValues: $"Released +{unusedQty} unused reservation for ProductionOrder {productionOrderId}");
                }
                reservation.QuantityReserved = reservation.QuantityConsumed;
                reservation.Status = ReservationStatus.Released;
                _unitOfWork.InventoryReservations.Update(reservation);
            }"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
