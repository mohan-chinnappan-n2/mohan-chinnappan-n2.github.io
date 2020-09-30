## TLS Handshake

### Trip 1
- Client
    - "Hello"
    - Protocol Version
    - Supported Cipher suites (scs)
- Server
    - Choose Cipher suites out of scs
    - Certs
        - Public Key
    - "Hello Done"

### Trip 2
- Client
    - Check the validity of the server provided Public Key
    - Creates pre-master-secret (PMS)  based on the server Public Key
    - Encrypts the PMS with server Public Key 
    - Sends Key Exchange with the encrypted PMS (ePMS) 
    - Generates Symmetric Key (SK) based on PMS
    - "Client Finished"
- Server
    - Receives the Key Exchange with encrypted PMS (ePMS) 
    - Decrypts the received  ePMS with its Private Key
    - Generates Symmetric Key (SK) based on the PMS
        - This SK is same as what client has as SK

### Trip 3
- Server
    - Send Change Cipher Spec is sent with this SK
        - Telling that I am changing from Asymmetric encryption to Symmetric encryption for the bulk encryption (for effiency)
    - "Finished"


### Data bulk encryption
- Server and Client use this agreed Symmetric Key (SK) for the bulk encryption of the data

![TLS hs](img/tls-hs-1.png)
### Video
- [Breaking Down the TLS Handshake](https://www.youtube.com/watch?v=cuR05y_2Gxc)    
- [How does HTTPS work? What's a CA? What's a self-signed Certificate?](https://www.youtube.com/watch?v=T4Df5_cojAs)
- [Secret Key Exchange (Diffie-Hellman) - Computerphile](https://www.youtube.com/watch?v=NmM9HA2MQGI)

