## Memory requirements

### Windows 7

- 1 gigahertz (GHz) or faster 32-bit (x86) or 64-bit (x64) processor
- 1  gigabyte (GB) RAM (32-bit) or 2 GB RAM (64-bit)
- 16 GB available hard disk space (32-bit) or 20 GB (64-bit)
- DirectX 9 graphics device with WDDM 1.0 or higher driver


### Windows 10 

- 1 gigahertz (GHz) or faster compatible processor or System on a Chip (SoC)
- RAM: 	1 gigabyte (GB) for 32-bit or 2 GB for 64-bit 
- Hard drive size: 32GB or larger hard disk
- Graphics card:	Compatible with DirectX 9 or later with WDDM 1.0 driver
- Display:	800x600

### Finding the memory leaks

```
dbgcmd

Memory: 16224K Avail: 4564K PageFlts: 31 InRam Krnl: 684K P: 680K
Commit: 24140K Limit: 24952K Peak: 24932K Pool N: 744K P: 2180K

## Tag   Type  Allocs       Frees        Diff    Bytes       Per Alloc


CM    Paged   1283  ( 0)  1002  ( 0)   281  1377312   ( 0)  4901
Strg  Paged  10385 ( 10)  6658  ( 4)  3727   317952 ( 512)    85
Fat   Paged   6662  ( 8)  4971  ( 6)  1691   174560 ( 128)   103
MmSt  Paged    614  ( 0)   441  ( 0)   173    83456   ( 0)   482

```

### Memory links
- [Finding a Memory Leak](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/finding-a-memory-leak)
- [Windows 7 system requirements](https://support.microsoft.com/en-us/help/10737/windows-7-system-requirements)
- [System requirements for installing Windows 10](https://www.microsoft.com/en-us/windows/windows-10-specifications#primaryR2)

