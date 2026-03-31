# Subgraph Migration Guide

The Graph hosted service has been discontinued. Here's how to migrate to The Graph Studio:

## 🎯 **Step 1: Create Account on The Graph Studio**

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Create a new subgraph

## 🚀 **Step 2: Deploy Your Subgraph**

### Install Graph CLI
```bash
npm install -g @graphprotocol/graph-cli
```

### Navigate to indexer directory
```bash
cd indexer
```

### Authenticate with The Graph Studio
```bash
graph auth --studio YOUR_DEPLOY_KEY_FROM_STUDIO
```

### Build the subgraph
```bash
graph codegen
graph build
```

### Deploy to Studio
```bash
graph deploy --studio password-manager
```

## 🔧 **Step 3: Update Your Environment Variables**

Once deployed, update your `.env` file:

```env
# Replace with your new Studio endpoint
NEXT_PUBLIC_API_URL=https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/password-manager/version/latest

# Other required variables
NEXT_PUBLIC_CONTRACT_ADDRESS=0x047B3cc70130F34387D00c923AA117cf22F989D2
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET_KEY=your_pinata_secret
```

## 📝 **Step 4: Update Subgraph Configuration**

Update `indexer/subgraph.yaml`:

```yaml
specVersion: 0.0.5
description: A subgraph for the KeyManager
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: KeyManager
    network: bsc  # Changed from chapel to bsc for mainnet
    source:
      address: "0x047B3cc70130F34387D00c923AA117cf22F989D2"  # Your contract address
      abi: KeyManager
      startBlock: 57500652  # Update this to your actual deployment block
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Key
      abis:
        - name: KeyManager
          file: ./abis/KeyManager.json
      eventHandlers:
        - event: KeyAdded(uint256,string,indexed address)
          handler: handleKeyAdded
        - event: KeyDeleted(uint256,indexed address)
          handler: handleKeyDeleted
        - event: KeyUpdated(uint256,string,indexed address)
          handler: handleKeyUpdated
      file: ./src/key-manager.ts
```

## 🔄 **Alternative: Use Direct Contract Calls**

If you prefer not to use a subgraph, the app now falls back to direct contract calls when GraphQL fails. This works but is less efficient for large datasets.

## ✅ **Testing**

After deployment:
1. Test your new endpoint in the browser
2. Verify the query works
3. Update your app's environment variables
4. Test the full flow

## 🆘 **Quick Fix for Development**

For immediate testing, you can temporarily disable subgraph queries by setting:

```env
NEXT_PUBLIC_API_URL=""
```

This will force the app to use direct contract calls only.
