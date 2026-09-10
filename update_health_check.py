import os
file_path = "e:/Nova/workflow_health_check.js"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('COALESCE(SUM(r."QuantityReserved"), 0)', 'COALESCE(SUM(r."QuantityReserved" - r."QuantityConsumed"), 0)')

with open(file_path, "w") as f:
    f.write(content)
print("Updated workflow_health_check.js")
