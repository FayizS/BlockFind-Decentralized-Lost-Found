// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Campus Lost & Found
/// @notice Store ONLY non-sensitive info. Everything here is publicly readable.
contract LostAndFound {
    struct Item {
        uint256 id;
        string name;
        string description;
        string location;
        bool isFound;      // false = lost, true = found
        address reporter;
        uint256 timestamp;
        bool recovered;
    }

    address public immutable deployer;
    Item[] private items;
    mapping(bytes32 => bool) private reported; // duplicate prevention (per reporter)

    event ItemReported(uint256 indexed id, address indexed reporter, string name, bool isFound);
    event ItemRecovered(uint256 indexed id, address indexed reporter);

    constructor() {
        deployer = msg.sender;
    }

    function reportItem(
        string calldata name,
        string calldata description,
        string calldata location,
        bool isFound
    ) external returns (uint256 id) {
        require(bytes(name).length > 0, "Item name cannot be empty");
        require(bytes(name).length <= 100, "Name too long");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(description).length <= 300, "Description too long");
        require(bytes(location).length <= 100, "Location too long");

        bytes32 h = keccak256(abi.encode(msg.sender, name, description, location, isFound));
        require(!reported[h], "Duplicate report");
        reported[h] = true;

        id = items.length;
        items.push(Item(id, name, description, location, isFound, msg.sender, block.timestamp, false));
        emit ItemReported(id, msg.sender, name, isFound);
    }

    function getItem(uint256 id) external view returns (Item memory) {
        require(id < items.length, "Item does not exist");
        return items[id];
    }

    function getAllItems() external view returns (Item[] memory) {
        return items;
    }

    function itemCount() external view returns (uint256) {
        return items.length;
    }

    function markRecovered(uint256 id) external {
        require(id < items.length, "Item does not exist");
        Item storage it = items[id];
        require(msg.sender == it.reporter, "Only the original reporter can do this");
        require(!it.recovered, "Already recovered");
        it.recovered = true;
        emit ItemRecovered(id, msg.sender);
    }
}
