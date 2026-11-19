import { PrismaClient, RoleType, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create Roles with explicit permission matrices
  const rolesData = [
    {
      name: RoleType.SUPER_ADMIN,
      description: "Full access to all modules, user management, roles, and system settings.",
      permissions: [
        "dashboard:view",
        "products:view",
        "products:manage",
        "categories:view",
        "categories:manage",
        "stock:in",
        "stock:out",
        "stock:adjust",
        "stock:history",
        "suppliers:view",
        "suppliers:manage",
        "warehouses:view",
        "warehouses:manage",
        "reports:view",
        "reports:export",
        "users:manage",
        "settings:manage",
      ],
    },
    {
      name: RoleType.ADMIN,
      description: "Manage products, categories, stock transactions, suppliers, warehouses, and view reports.",
      permissions: [
        "dashboard:view",
        "products:view",
        "products:manage",
        "categories:view",
        "categories:manage",
        "stock:in",
        "stock:out",
        "stock:adjust",
        "stock:history",
        "suppliers:view",
        "suppliers:manage",
        "warehouses:view",
        "warehouses:manage",
        "reports:view",
        "reports:export",
      ],
    },
    {
      name: RoleType.STAFF,
      description: "View products and categories, record stock in and stock out, and view stock history.",
      permissions: [
        "dashboard:view",
        "products:view",
        "categories:view",
        "stock:in",
        "stock:out",
        "stock:history",
      ],
    },
    {
      name: RoleType.VIEWER,
      description: "Read-only access to dashboard, inventory catalog, and analytical reports.",
      permissions: [
        "dashboard:view",
        "products:view",
        "categories:view",
        "stock:history",
        "suppliers:view",
        "warehouses:view",
        "reports:view",
      ],
    },
  ];

  const rolesMap: Record<RoleType, string> = {} as Record<RoleType, string>;

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        permissions: r.permissions,
      },
      create: {
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      },
    });
    rolesMap[r.name] = role.id;
  }

  // 2. Create Default Users for Each Role
  const defaultPasswordHash = await bcrypt.hash("Password123!", 12);
  const simpleAdminPasswordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      passwordHash: simpleAdminPasswordHash,
      roleId: rolesMap[RoleType.SUPER_ADMIN],
      isActive: true,
    },
    create: {
      name: "Rina (Super Admin)",
      email: "admin@admin.com",
      passwordHash: simpleAdminPasswordHash,
      roleId: rolesMap[RoleType.SUPER_ADMIN],
      isActive: true,
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@nexus-ims.com" },
    update: {},
    create: {
      name: "Elena Vance (Super Admin)",
      email: "superadmin@nexus-ims.com",
      passwordHash: defaultPasswordHash,
      roleId: rolesMap[RoleType.SUPER_ADMIN],
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexus-ims.com" },
    update: {},
    create: {
      name: "Marcus Sterling (Operations Admin)",
      email: "admin@nexus-ims.com",
      passwordHash: defaultPasswordHash,
      roleId: rolesMap[RoleType.ADMIN],
      isActive: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@nexus-ims.com" },
    update: {},
    create: {
      name: "David Chen (Warehouse Staff)",
      email: "staff@nexus-ims.com",
      passwordHash: defaultPasswordHash,
      roleId: rolesMap[RoleType.STAFF],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@nexus-ims.com" },
    update: {},
    create: {
      name: "Sarah Jenkins (Financial Auditor)",
      email: "viewer@nexus-ims.com",
      passwordHash: defaultPasswordHash,
      roleId: rolesMap[RoleType.VIEWER],
      isActive: true,
    },
  });

  // 3. System Settings
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Nexus Enterprise Logistics",
      companyEmail: "ops@nexus-ims.com",
      companyPhone: "+1 (415) 890-4321",
      companyAddress: "500 Howard Street, Suite 400, San Francisco, CA 94105",
      currency: "USD",
      lowStockAlertGlobal: true,
      defaultMinStock: 15,
    },
  });

  // 4. Categories
  const categoriesInput = [
    {
      name: "Computing & Workstations",
      slug: "computing-workstations",
      description: "Enterprise laptops, desktops, servers, and workstation hardware.",
    },
    {
      name: "Networking & Infrastructure",
      slug: "networking-infrastructure",
      description: "Managed switches, enterprise routers, fiber transceivers, and access points.",
    },
    {
      name: "Displays & Peripherals",
      slug: "displays-peripherals",
      description: "4K monitors, docking stations, mechanical keyboards, and precision mice.",
    },
    {
      name: "Storage & Memory",
      slug: "storage-memory",
      description: "NVMe SSDs, enterprise NAS drives, ECC RAM modules, and backup tapes.",
    },
    {
      name: "Power & Rack Accessories",
      slug: "power-rack-accessories",
      description: "Rackmount UPS units, PDUs, patch panels, and structured cabling.",
    },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesInput) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description },
      create: cat,
    });
    categoriesMap[cat.slug] = created.id;
  }

  // 5. Suppliers
  const suppliersInput = [
    {
      companyName: "Apex Silicon Distribution",
      contactPerson: "Robert Vance",
      email: "orders@apexsilicon.com",
      phone: "+1 (800) 555-0142",
      address: "2400 Semiconductor Way, Austin, TX 78741",
    },
    {
      companyName: "Global NetSystems Supply",
      contactPerson: "Mei Lin",
      email: "procurement@globalnetsystems.io",
      phone: "+1 (408) 555-0198",
      address: "880 Tasman Drive, San Jose, CA 95134",
    },
    {
      companyName: "Pacific Rim Components Ltd",
      contactPerson: "Kenji Takahashi",
      email: "supply@pacificrim-comp.com",
      phone: "+1 (206) 555-0167",
      address: "1200 Harbor Ave SW, Seattle, WA 98126",
    },
  ];

  const suppliers: string[] = [];
  for (const sup of suppliersInput) {
    const created = await prisma.supplier.upsert({
      where: { email: sup.email },
      update: {},
      create: sup,
    });
    suppliers.push(created.id);
  }

  // 6. Warehouses
  const warehousesInput = [
    {
      name: "West Coast Distribution Hub",
      code: "WH-SFO-01",
      location: "Oakland Port Industrial Park, CA",
      description: "Primary West Coast receiving and high-velocity fulfillment center.",
    },
    {
      name: "Central Logistics Facility",
      code: "WH-DAL-02",
      location: "Alliance Airport Corridor, Dallas, TX",
      description: "Central US hub for bulk enterprise hardware and rack infrastructure.",
    },
    {
      name: "East Coast Express Depot",
      code: "WH-EWR-03",
      location: "Newark Liberty Logistics Zone, NJ",
      description: "Northeast rapid dispatch warehouse for enterprise clients.",
    },
  ];

  const warehousesMap: Record<string, string> = {};
  for (const wh of warehousesInput) {
    const created = await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {},
      create: wh,
    });
    warehousesMap[wh.code] = created.id;
  }

  // 7. Products & Initial Inventory
  const productsInput = [
    {
      sku: "COMP-MBP16-M3P",
      name: "ProBook Studio 16 Workstation",
      description: "16-inch High-Performance Workstation, 36GB Unified RAM, 1TB NVMe SSD.",
      categoryId: categoriesMap["computing-workstations"],
      unit: "unit",
      purchasePrice: 1850.0,
      sellingPrice: 2399.0,
      minimumStock: 12,
      initialStock: { "WH-SFO-01": 24, "WH-DAL-02": 15, "WH-EWR-03": 10 },
    },
    {
      sku: "NET-SW48-POE",
      name: "Catalyst Core 48-Port PoE+ Switch",
      description: "Layer-3 Managed Gigabit Switch with 4x 10G SFP+ Uplinks, 740W PoE budget.",
      categoryId: categoriesMap["networking-infrastructure"],
      unit: "unit",
      purchasePrice: 640.0,
      sellingPrice: 899.0,
      minimumStock: 10,
      initialStock: { "WH-SFO-01": 4, "WH-DAL-02": 3, "WH-EWR-03": 0 }, // Low stock (7 <= 10)
    },
    {
      sku: "DISP-U2723QE-4K",
      name: "UltraSharp 27 4K USB-C Hub Monitor",
      description: "27-inch IPS Black 4K UHD Monitor with 90W USB-C Power Delivery and RJ45.",
      categoryId: categoriesMap["displays-peripherals"],
      unit: "pcs",
      purchasePrice: 390.0,
      sellingPrice: 549.0,
      minimumStock: 20,
      initialStock: { "WH-SFO-01": 42, "WH-DAL-02": 28, "WH-EWR-03": 18 },
    },
    {
      sku: "STOR-NVME-4TB",
      name: "Enterprise Gen4 NVMe SSD 4TB",
      description: "PCIe 4.0 M.2 2280 Enterprise Solid State Drive with power-loss protection.",
      categoryId: categoriesMap["storage-memory"],
      unit: "pcs",
      purchasePrice: 245.0,
      sellingPrice: 349.0,
      minimumStock: 25,
      initialStock: { "WH-SFO-01": 10, "WH-DAL-02": 8, "WH-EWR-03": 4 }, // Low stock (22 <= 25)
    },
    {
      sku: "PWR-UPS-3000R",
      name: "Smart-UPS 3000VA 2U Rackmount",
      description: "Sinewave Online Double-Conversion UPS with network management card.",
      categoryId: categoriesMap["power-rack-accessories"],
      unit: "unit",
      purchasePrice: 920.0,
      sellingPrice: 1299.0,
      minimumStock: 8,
      initialStock: { "WH-SFO-01": 3, "WH-DAL-02": 2, "WH-EWR-03": 1 }, // Low stock (6 <= 8)
    },
    {
      sku: "PER-DOCK-TB4",
      name: "Thunderbolt 4 Enterprise Dock",
      description: "Universal Dual-4K Thunderbolt 4 Docking Station with 130W Power Delivery.",
      categoryId: categoriesMap["displays-peripherals"],
      unit: "pcs",
      purchasePrice: 165.0,
      sellingPrice: 249.0,
      minimumStock: 30,
      initialStock: { "WH-SFO-01": 65, "WH-DAL-02": 40, "WH-EWR-03": 35 },
    },
  ];

  const existingMovementsCount = await prisma.stockMovement.count();

  for (let i = 0; i < productsInput.length; i++) {
    const p = productsInput[i];
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        unit: p.unit,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        minimumStock: p.minimumStock,
      },
    });

    for (const [whCode, qty] of Object.entries(p.initialStock)) {
      const warehouseId = warehousesMap[whCode];
      await prisma.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId,
          },
        },
        update: {},
        create: {
          productId: product.id,
          warehouseId,
          quantity: qty,
        },
      });

      if (existingMovementsCount === 0 && qty > 0) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (10 - i));

        await prisma.stockMovement.create({
          data: {
            referenceNo: `SIN-SEED-${p.sku}-${whCode}`,
            type: MovementType.STOCK_IN,
            productId: product.id,
            warehouseId,
            supplierId: suppliers[i % suppliers.length],
            quantity: qty,
            previousStock: 0,
            newStock: qty,
            unitPrice: p.purchasePrice,
            notes: "Initial warehouse stock allocation",
            transactionDate: daysAgo,
            performedById: adminUser.id,
          },
        });
      }
    }
  }

  // Add a sample Stock Out and Audit Log if fresh seed
  if (existingMovementsCount === 0) {
    const sampleProduct = await prisma.product.findUnique({
      where: { sku: "DISP-U2723QE-4K" },
    });
    const sfoWarehouseId = warehousesMap["WH-SFO-01"];

    if (sampleProduct && sfoWarehouseId) {
      await prisma.stockMovement.create({
        data: {
          referenceNo: "SOUT-SEED-1001",
          type: MovementType.STOCK_OUT,
          productId: sampleProduct.id,
          warehouseId: sfoWarehouseId,
          quantity: 8,
          previousStock: 50,
          newStock: 42,
          unitPrice: sampleProduct.sellingPrice,
          destination: "Stripe HQ Floor 4 Deployment",
          notes: "Client order #SO-99412 dispatched via FedEx Freight",
          transactionDate: new Date(Date.now() - 86400000 * 2),
          performedById: staffUser.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: "SYSTEM_SEED_COMPLETED",
        entityType: "System",
        entityId: "default",
        details: {
          message: "Database initialized with default roles, users, warehouses, and catalog.",
        },
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
