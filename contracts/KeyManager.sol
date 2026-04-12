// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract KeyManager {
    struct Key {
        string ipfsHash;
        bool isDeleted;
    }

    event KeyAdded(uint id, string ipfsHash, address indexed owner);
    event KeyUpdated(uint id, string ipfsHash, address indexed owner);
    event KeyDeleted(uint id, address indexed owner);

    mapping(address => Key[]) private keys;
    mapping(address => mapping(string => bool)) private isIpfsHashExists;

    modifier onlyUniqueIpfsHash(string calldata _ipfsHash) {
        require(
            bytes(_ipfsHash).length >= 46 && bytes(_ipfsHash).length <= 64,
            "KeyManager: Invalid IPFS hash length!"
        );
        require(
            !isIpfsHashExists[msg.sender][_ipfsHash],
            "KeyManager: IPFS hash already exists!"
        );
        _;
    }

    modifier onlyActiveKey(uint _id) {
        require(
            _id < keys[msg.sender].length,
            "KeyManager: Key does not exist!"
        );
        require(
            !keys[msg.sender][_id].isDeleted,
            "KeyManager: Key is already deleted!"
        );
        _;
    }

    function addKey(string calldata _ipfsHash)
        public
        onlyUniqueIpfsHash(_ipfsHash)
    {
        keys[msg.sender].push(Key(_ipfsHash, false));
        isIpfsHashExists[msg.sender][_ipfsHash] = true;
        
        emit KeyAdded(keys[msg.sender].length - 1, _ipfsHash, msg.sender);
    }

    function updateKey(uint _id, string calldata _ipfsHash)
        public
        onlyUniqueIpfsHash(_ipfsHash)
        onlyActiveKey(_id)
    {
        // Free the old hash so it can be reused later if needed
        string memory oldHash = keys[msg.sender][_id].ipfsHash;
        isIpfsHashExists[msg.sender][oldHash] = false;
        
        // Update to new hash
        keys[msg.sender][_id].ipfsHash = _ipfsHash;
        isIpfsHashExists[msg.sender][_ipfsHash] = true;
        
        emit KeyUpdated(_id, _ipfsHash, msg.sender);
    }

    function softDeleteKey(uint _id) public onlyActiveKey(_id) {
        keys[msg.sender][_id].isDeleted = true;
        
        // Also free up the hash from the uniqueness map
        string memory activeHash = keys[msg.sender][_id].ipfsHash;
        isIpfsHashExists[msg.sender][activeHash] = false;

        emit KeyDeleted(_id, msg.sender);
    }

    function getMyKeys() public view returns (Key[] memory) {
        return keys[msg.sender];
    }
}
