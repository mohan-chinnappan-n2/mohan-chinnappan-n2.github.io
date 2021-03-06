### Google's recommendation Optimize Chrome Browser on virtual desktops

- This content is from Google's page [Optimize Chrome Browser on virtual desktops](https://support.google.com/chrome/a/answer/9303118)


### For administrators who manage Chrome Browser on Windows for a business or school.

- As an administrator, you can deploy Chrome Browser in a virtual desktop infrastructure (VDI) environment such as Citrix® Virtual Apps and Desktops. If Chrome Browser is running too slow or using too much memory, here are some suggestions for how to improve Chrome Browser performance in a VDI environment.

### Configure your VDI environment
**Server memory and CPU size**
- The number of users who can simultaneously use Chrome Browser on virtual desktops depends on your VDI servers’ memory and CPU resources. For Chrome Browser, Google recommends 1 GB RAM and between 2 and 4 virtual central processing units (vCPUs) per virtual desktop. Check to make sure that these recommendations suit your organization. For example, to let 100 users simultaneously use Chrome Browser on virtual desktops, you need at least 100 GB RAM and 200 vCPUs.

**Hardware acceleration**
- If your VDI server doesn’t support graphics processing units (GPUs), use Group Policy Management Editor to set the Use hardware acceleration when available policy to false.

- If this policy is set to true or left unset, hardware acceleration will be enabled unless a certain GPU feature is blacklisted.
    - If this policy is set to false, hardware acceleration will be disabled
    - Windows registry location: <code>Software\Policies\Google\Chrome\HardwareAccelerationModeEnabled</code>
    -  Example value (Windows):<code> 0x00000001</code>
    - Via Chrome settings
 ![hardware accel](img/hardware-accel.png)
    - Via Windows Registry
```
Hold down the Windows Key and press “R” to bring up the Run window.

Type “regedit“, then press “Enter” to bring up the Registry Editor.
Navigate to:

HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\
Note: You may have to create the “Google” and “Chrome” folders.
Right-click “Chrome” and select “New” > “DWORD 32-bit value“
Give the value a name of “HardwareAccelerationModeEnabled“.
Set the value data to “0” to disable Hardware Acceleration. Set it to “1” to enable it.

```

 **Extensions**
- Extensions can use a large amount of memory or increase the amount of time it takes to start Chrome Browser. Google recommends that you limit the number of extensions that users can install. For information, see Set Chrome app and extension policies (Windows).

**Roaming user profiles**
- Turn on roaming user profiles so that users have a consistent Chrome Browser experience each time they use the browser on a virtual desktop. For details, see Use Chrome Browser with roaming user profiles.

### What to tell users

- Close unused tabs—The more tabs that users have open simultaneously, the harder Chrome Browser has to work. Tell users to close tabs that they’re not using. Alternatively, you can deploy or let users install an extension that reduces memory usage by suspending tabs that aren’t being used, such as The Great Suspender. 

- Avoid network congestion—Advise users not to simultaneously use streaming services on virtual desktops. For example, 100 users watching YouTube will increase the demand on network bandwidth as well as memory and CPU resources. Remember that **GPUs aren’t used on most VDI server**.


### Chrome User agent (navigator.userAgent)

 - **Windows 7**:  Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36
 - **Windows 10**: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36
 - **macOS 10.13.6**: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36
 - **Ubuntu 18**: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome 80.0.3987.106 Safari/537.36
