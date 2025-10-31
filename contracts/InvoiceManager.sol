// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract InvoiceManager {
    // Invoice status enum
    enum InvoiceStatus {
        Pending,
        Paid,
        Cancelled
    }

    // Invoice structure
    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        string description;
        euint64 encryptedAmount;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }

    // State variables
    uint256 public invoiceCount;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public sentInvoices;
    mapping(address => uint256[]) public receivedInvoices;

    // Constructor to configure Zama for Sepolia
    constructor() {
        FHE.setCoprocessor(ZamaConfig.getSepoliaConfig());
    }

    // Events
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

    // Modifiers
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

    /**
     * @dev Create a new invoice with encrypted amount
     * @param _recipient Address of the invoice recipient
     * @param _description Description of the invoice
     * @param _encryptedAmount Encrypted amount (euint64)
     * @param _inputProof Input proof for encrypted amount
     * @param _dueDate Due date timestamp
     */
    function createInvoice(
        address _recipient,
        string memory _description,
        externalEuint64 _encryptedAmount,
        bytes calldata _inputProof,
        uint256 _dueDate
    ) external returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Cannot send invoice to yourself");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_dueDate > block.timestamp, "Due date must be in the future");

        // Convert encrypted input to euint64
        euint64 amount = FHE.fromExternal(_encryptedAmount, _inputProof);

        // Allow both sender and recipient to access the encrypted amount
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, _recipient);

        uint256 invoiceId = invoiceCount;
        invoiceCount++;

        Invoice storage newInvoice = invoices[invoiceId];
        newInvoice.id = invoiceId;
        newInvoice.sender = msg.sender;
        newInvoice.recipient = _recipient;
        newInvoice.description = _description;
        newInvoice.encryptedAmount = amount;
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

    /**
     * @dev Pay an invoice by sending ETH to the invoice creator
     * @param _invoiceId ID of the invoice to pay
     */
    function payInvoice(uint256 _invoiceId)
        external
        payable
        invoiceExists(_invoiceId)
        onlyRecipient(_invoiceId)
        invoicePending(_invoiceId)
    {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        Invoice storage invoice = invoices[_invoiceId];
        address payable sender = payable(invoice.sender);
        
        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;

        (bool success, ) = sender.call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit InvoicePaid(_invoiceId, msg.sender, block.timestamp);
    }

    /**
     * @dev Cancel an invoice
     * @param _invoiceId ID of the invoice to cancel
     */
    function cancelInvoice(uint256 _invoiceId)
        external
        invoiceExists(_invoiceId)
        onlySender(_invoiceId)
        invoicePending(_invoiceId)
    {
        Invoice storage invoice = invoices[_invoiceId];
        invoice.status = InvoiceStatus.Cancelled;

        emit InvoiceCancelled(_invoiceId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get encrypted amount for an invoice
     * @param _invoiceId ID of the invoice
     * @return Encrypted amount as euint64
     */
    function getEncryptedAmount(uint256 _invoiceId)
        external
        view
        invoiceExists(_invoiceId)
        returns (euint64)
    {
        require(
            msg.sender == invoices[_invoiceId].sender ||
                msg.sender == invoices[_invoiceId].recipient,
            "Not authorized to view amount"
        );
        return invoices[_invoiceId].encryptedAmount;
    }

    /**
     * @dev Get invoice details (without encrypted amount)
     * @param _invoiceId ID of the invoice
     */
    function getInvoiceDetails(uint256 _invoiceId)
        external
        view
        invoiceExists(_invoiceId)
        returns (
            uint256 id,
            address sender,
            address recipient,
            string memory description,
            uint256 dueDate,
            InvoiceStatus status,
            uint256 createdAt,
            uint256 paidAt
        )
    {
        Invoice storage invoice = invoices[_invoiceId];
        return (
            invoice.id,
            invoice.sender,
            invoice.recipient,
            invoice.description,
            invoice.dueDate,
            invoice.status,
            invoice.createdAt,
            invoice.paidAt
        );
    }

    /**
     * @dev Get all invoice IDs sent by an address
     * @param _sender Address of the sender
     */
    function getSentInvoices(address _sender)
        external
        view
        returns (uint256[] memory)
    {
        return sentInvoices[_sender];
    }

    /**
     * @dev Get all invoice IDs received by an address
     * @param _recipient Address of the recipient
     */
    function getReceivedInvoices(address _recipient)
        external
        view
        returns (uint256[] memory)
    {
        return receivedInvoices[_recipient];
    }

    /**
     * @dev Get total number of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return invoiceCount;
    }
}
