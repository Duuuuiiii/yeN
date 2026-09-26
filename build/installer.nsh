!macro customInit
  ; Only choose a non-system drive for a fresh installation. Upgrades keep the
  ; path stored by the existing installation.
  ${If} $hasPerMachineInstallation == "0"
  ${AndIf} $hasPerUserInstallation == "0"
    IfFileExists "E:\*.*" yen_use_e yen_check_d

    yen_use_e:
      StrCpy $INSTDIR "E:\Apps\yeN"
      Goto yen_install_dir_done

    yen_check_d:
      IfFileExists "D:\*.*" yen_use_d yen_install_dir_done

    yen_use_d:
      StrCpy $INSTDIR "D:\Apps\yeN"

    yen_install_dir_done:
  ${EndIf}
!macroend
