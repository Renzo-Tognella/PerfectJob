# Inicia a API com profile dev (porta 8081)
# No PowerShell, o argumento -D precisa estar entre aspas.
Set-Location $PSScriptRoot
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
