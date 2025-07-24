import {
  KeyAdded as KeyAddedEvent,
  KeyDeleted as KeyDeletedEvent,
  KeyUpdated as KeyUpdatedEvent
} from "../generated/KeyManager/KeyManager";
import { Key } from "../generated/schema";

export function handleKeyAdded(event: KeyAddedEvent): void {
  let key = new Key(event.params.owner.toHex() + "-" + event.params.id.toString());
  key.keyId = event.params.id.toString();
  key.ipfsHash = event.params.ipfsHash;
  key.owner = event.params.owner;
  key.isDeleted = false;
  key.keyA = "";
  key.keyB = "";
  key.updatedAt = event.block.timestamp;
  key.save();
}

export function handleKeyUpdated(event: KeyUpdatedEvent): void {
  let key = Key.load(event.params.owner.toHex() + "-" + event.params.id.toString());
  if (!key) {
    key = new Key(event.params.owner.toHex() + "-" + event.params.id.toString());
    key.keyId = event.params.id.toString();
    key.owner = event.params.owner;
    key.isDeleted = false;
    key.keyA = "";
    key.keyB = "";
  }
  key.ipfsHash = event.params.ipfsHash;
  key.updatedAt = event.block.timestamp;
  key.save();
}

export function handleKeyDeleted(event: KeyDeletedEvent): void {
  let key = Key.load(event.params.owner.toHex() + "-" + event.params.id.toString());
  if (key) {
    key.isDeleted = true;
    key.updatedAt = event.block.timestamp;
    key.save();
  }
}




// //import { ipfs, json } from "@graphprotocol/graph-ts";
// import {
//   KeyAdded as KeyAddedEvent,
//   KeyDeleted as KeyDeletedEvent,
//   KeyUpdated as KeyUpdatedEvent
// } from "../generated/KeyManager/KeyManager";
// import { Key } from "../generated/schema";

// export function handleKeyAdded(event: KeyAddedEvent): void {
//   let key = new Key(event.params.owner.toHex() + "-" + event.params.id.toString());
//   key.keyId = event.params.id.toString();
//   key.ipfsHash = event.params.ipfsHash;
//   key.owner = event.params.owner;
//   key.isDeleted = false;
//   // let ipfsData = ipfs.cat(event.params.ipfsHash);
//   // if (ipfsData) {
//   //   const value = json.fromBytes(ipfsData).toObject();
//   //   if (value) {
//       const keyA =""; // value.get("encryptedString");
//       const keyB =""; // value.get("encryptedSymmetricKey");
//       // if (keyA) key.keyA = keyA.toString();
//       // if (keyB) key.keyB = keyB.toString();
//   //   }
//   // }
//   key.updatedAt = event.block.timestamp;
//   key.save();
// }

// // export function handleKeyUpdated(event: KeyUpdatedEvent): void {
// //   let key = Key.load(event.params.owner.toHex() + "-" + event.params.id.toString());
// //   if (!key) {
// //     key = new Key(event.params.owner.toHex() + "-" + event.params.id.toString());
// //     key.keyId = event.params.id.toString();
// //     key.owner = event.params.owner;
// //     key.isDeleted = false;
// //   }
// //   key.ipfsHash = event.params.ipfsHash;
// //   let ipfsData = ipfs.cat(event.params.ipfsHash);
// //   if (ipfsData) {
// //     const value = json.fromBytes(ipfsData).toObject();
// //     if (value) {
// //       const keyA = value.get("encryptedString");
// //       const keyB = value.get("encryptedSymmetricKey");
// //       if (keyA) key.keyA = keyA.toString();
// //       if (keyB) key.keyB = keyB.toString();
// //     }
// //   }
// //   key.updatedAt = event.block.timestamp;
// //   key.save();
// // }

// export function handleKeyUpdated(event: KeyUpdatedEvent): void {
//   let key = Key.load(event.params.owner.toHex() + "-" + event.params.id.toString());
//   if (!key) {
//     key = new Key(event.params.owner.toHex() + "-" + event.params.id.toString());
//     key.keyId = event.params.id.toString();
//     key.owner = event.params.owner;
//     key.isDeleted = false;
//     key.keyA = "";
//     key.keyB = "";
//   }
  
//   key.ipfsHash = event.params.ipfsHash;
  
//   // Remove IPFS data fetching - The Graph Studio doesn't support ipfs.cat()
//   // The client will fetch and decrypt this data directly from IPFS
  
//   key.updatedAt = event.block.timestamp;
//   key.save();
// }

// export function handleKeyDeleted(event: KeyDeletedEvent): void {
//   let key = Key.load(event.params.owner.toHex() + "-" + event.params.id.toString());
//   if (key) {
//     key.isDeleted = true;
//     key.updatedAt = event.block.timestamp;
//     key.save();
//   }

// }


