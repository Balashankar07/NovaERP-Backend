namespace NovaERP.Application.Common.Exceptions;

public class MaterialShortageException : Exception
{
    public object Shortages { get; }

    public MaterialShortageException(string message, object shortages) : base(message)
    {
        Shortages = shortages;
    }
}
