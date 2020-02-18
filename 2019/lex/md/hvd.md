### Google's recommendation Optimize Chrome Browser on virtual desktops

- Content is from Google's page [Optimize Chrome Browser on virtual desktops](https://support.google.com/chrome/a/answer/9303118)


### For administrators who manage Chrome Browser on Windows for a business or school.

- As an administrator, you can deploy Chrome Browser in a virtual desktop infrastructure (VDI) environment such as Citrix® Virtual Apps and Desktops. If Chrome Browser is running too slow or using too much memory, here are some suggestions for how to improve Chrome Browser performance in a VDI environment.

### Configure your VDI environment
**Server memory and CPU size**
- The number of users who can simultaneously use Chrome Browser on virtual desktops depends on your VDI servers’ memory and CPU resources. For Chrome Browser, Google recommends 1 GB RAM and between 2 and 4 virtual central processing units (vCPUs) per virtual desktop. Check to make sure that these recommendations suit your organization. For example, to let 100 users simultaneously use Chrome Browser on virtual desktops, you need at least 100 GB RAM and 200 vCPUs.

**Hardware acceleration**
- If your VDI server doesn’t support graphics processing units (GPUs), use Group Policy Management Editor to set the Use hardware acceleration when available policy to false.

**Extensions**
- Extensions can use a large amount of memory or increase the amount of time it takes to start Chrome Browser. Google recommends that you limit the number of extensions that users can install. For information, see Set Chrome app and extension policies (Windows).

**Roaming user profiles**
- Turn on roaming user profiles so that users have a consistent Chrome Browser experience each time they use the browser on a virtual desktop. For details, see Use Chrome Browser with roaming user profiles.

### What to tell users

- Close unused tabs—The more tabs that users have open simultaneously, the harder Chrome Browser has to work. Tell users to close tabs that they’re not using. Alternatively, you can deploy or let users install an extension that reduces memory usage by suspending tabs that aren’t being used, such as The Great Suspender. 

- Avoid network congestion—Advise users not to simultaneously use streaming services on virtual desktops. For example, 100 users watching YouTube will increase the demand on network bandwidth as well as memory and CPU resources. Remember that **GPUs aren’t used on most VDI server**.


