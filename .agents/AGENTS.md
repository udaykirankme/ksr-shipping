# Agent Rules for KSR Shipping Services

## Security Rules
- **NEVER** push `.env` files or files containing secrets/passwords to GitHub or any remote repository. Always ensure they are properly added to `.gitignore` and do not use `git add .` without carefully verifying what is being staged.

## Restricted Commands
You **MUST** explicitly ask the USER for permission before running any of the following commands in the terminal. Do not run them automatically:

- **Git & GitHub CLI**: `git`, `gh`, `git push`, `git push --force`, `git push -f`, `git reset --hard`, `git clean -fd`, `git clean -fdx`, `git add`, `git commit`, `git pull`, `git fetch`, `git clone`, `git merge`, `git rebase`, `git branch`, `git checkout`, `git switch`, `git reset`, `git remote`, `git tag`, `git stash`, `git cherry-pick`, `git revert`, `git rm`, `git mv`, `gh repo`, `gh pr`, `gh issue`, `gh release`
- **File & Disk Deletion/Modification**: `Remove-Item`, `rmdir`, `del`, `erase`, `format`, `diskpart`
- **System Administration & Config**: `reg`, `reg.exe`, `netsh`, `sc`, `sc.exe`, `takeown`, `icacls`, `cacls`, `cipher`, `bcdedit`, `wbadmin`, `mountvol`, `fsutil`
- **Process & Power Management**: `shutdown`, `Restart-Computer`, `Stop-Computer`, `taskkill`, `kill`
- **Privilege & Permissions**: `sudo`, `chmod`, `chown`
- **Network Requests**: `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`
- **Misc/Security**: `certutil`, `bitsadmin`, `powershell -enc`, `powershell -EncodedCommand`
