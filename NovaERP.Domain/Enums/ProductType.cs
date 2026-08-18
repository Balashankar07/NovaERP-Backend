namespace NovaERP.Domain.Enums;

/// <summary>
/// Distinguishes between Finished Goods (manufactured for sale) 
/// and Components (raw materials / sub-assemblies used in production).
/// Values are intentionally preserved to match the existing database column:
/// 1 = FinishedGood, 2 = Component.
/// </summary>
public enum ProductType
{
    /// <summary>
    /// A manufactured product intended for sale to end customers.
    /// Brand must always be Nova Electronics.
    /// </summary>
    FinishedGood = 1,

    /// <summary>
    /// A raw material, sub-assembly, or part used in a Bill of Materials.
    /// Brand is the actual component manufacturer.
    /// </summary>
    Component = 2
}
