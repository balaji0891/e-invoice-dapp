// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InvoiceManagerSimple {
    enum InvoiceStatus {
        Pending,
        Paid,
        Cancelled
    }

    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        string description;
        uint256 amountInWei;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }

    uint256 public invoiceCount;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public sentInvoices;
    mapping(address => uint256[]) public receivedInvoices;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed sender,
        address indexed recipient,
        string description,
        uint256 dueDate,
        uint256 createdAt
    );

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 paidAt
    );

    event InvoiceCancelled(
        uint256 indexed invoiceId,
        address indexed canceller,
        uint256 cancelledAt
    );

    modifier onlySender(uint256 _invoiceId) {
        require(
            invoices[_invoiceId].sender == msg.sender,
            "Only sender can perform this action"
        );
        _;
    }

    modifier onlyRecipient(uint256 _invoiceId) {
        require(
            invoices[_invoiceId].recipient == msg.sender,
            "Only recipient can perform this action"
        );
        _;
    }

    modifier invoiceExists(uint256 _invoiceId) {
        require(_invoiceId < invoiceCount, "Invoice does not exist");
        _;
    }

    modifier invoicePending(uint256 _invoiceId) {
        require(
            invoices[_invoiceId].status == InvoiceStatus.Pending,
            "Invoice is not pending"
        );
        _;
    }

    function createInvoice(
        address _recipient,
        string memory _description,
        uint256 _amountInWei,
        uint256 _dueDate
    ) external returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Cannot send invoice to yourself");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_amountInWei > 0, "Amount must be greater than 0");
        require(_dueDate > block.timestamp, "Due date must be in the future");

        uint256 invoiceId = invoiceCount;
        invoiceCount++;

        Invoice storage newInvoice = invoices[invoiceId];
        newInvoice.id = invoiceId;
        newInvoice.sender = msg.sender;
        newInvoice.recipient = _recipient;
        newInvoice.description = _description;
        newInvoice.amountInWei = _amountInWei;
        newInvoice.dueDate = _dueDate;
        newInvoice.status = InvoiceStatus.Pending;
        newInvoice.createdAt = block.timestamp;
        newInvoice.paidAt = 0;

        sentInvoices[msg.sender].push(invoiceId);
        receivedInvoices[_recipient].push(invoiceId);

        emit InvoiceCreated(
            invoiceId,
            msg.sender,
            _recipient,
            _description,
            _dueDate,
            block.timestamp
        );

        return invoiceId;
    }

    function payInvoice(uint256 _invoiceId)
        external
        payable
        invoiceExists(_invoiceId)
        onlyRecipient(_invoiceId)
        invoicePending(_invoiceId)
    {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(msg.value == invoice.amountInWei, "Payment amount must match invoice amount exactly");
        require(msg.value > 0, "Payment amount must be greater than 0");

        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;

        (bool success, ) = payable(invoice.sender).call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit InvoicePaid(_invoiceId, msg.sender, block.timestamp);
    }

    function cancelInvoice(uint256 _invoiceId)
        external
        invoiceExists(_invoiceId)
        onlySender(_invoiceId)
        invoicePending(_invoiceId)
    {
        invoices[_invoiceId].status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(_invoiceId, msg.sender, block.timestamp);
    }

    function getInvoiceDetails(uint256 _invoiceId)
        external
        view
        invoiceExists(_invoiceId)
        returns (
            uint256 id,
            address sender,
            address recipient,
            string memory description,
            uint256 amountInWei,
            uint256 dueDate,
            InvoiceStatus status,
            uint256 createdAt,
            uint256 paidAt
        )
    {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(
            msg.sender == invoice.sender || msg.sender == invoice.recipient,
            "Only sender or recipient can view invoice details"
        );

        return (
            invoice.id,
            invoice.sender,
            invoice.recipient,
            invoice.description,
            invoice.amountInWei,
            invoice.dueDate,
            invoice.status,
            invoice.createdAt,
            invoice.paidAt
        );
    }

    function getSentInvoices(address _sender) external view returns (uint256[] memory) {
        return sentInvoices[_sender];
    }

    function getReceivedInvoices(address _recipient) external view returns (uint256[] memory) {
        return receivedInvoices[_recipient];
    }

    function getTotalInvoices() external view returns (uint256) {
        return invoiceCount;
    }
}
