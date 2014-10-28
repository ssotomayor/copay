'use strict';

var BackupService = function($rootScope, notification, cryptoUtils) {
  this.$rootScope = $rootScope;
  this.notifications = notification;
  this.cryptoUtils = cryptoUtils;
};

BackupService.prototype.getCopayer = function(wallet) {
  return wallet.totalCopayers > 1 ? wallet.getMyCopayerNickname() : '';
};

BackupService.prototype._download = function(ew, walletName, filename) {
  var blob = new Blob([ew], {
    type: 'text/plain;charset=utf-8'
  });


  // show a native save dialog if we are in the shell
  // and pass the wallet to the shell to convert to node Buffer
  if (window.cshell) {
    return window.cshell.send('backup:download', {
      name: walletName,
      wallet: ew
    });
  }

  // throw an email intent if we are in the mobile version
  if (window.cordova) {
    var name = wallet.name ? wallet.name + ' ' : '';
    return window.plugin.email.open({
      subject: 'Copay - ' + name + 'Wallet ' + 'Backup',
      body: 'Here is the encrypted backup of the wallet ' + wallet.id,
      attachments: ['base64:' + filename + '//' + btoa(ew)]
    });
  }
  this.notifications.success('Backup created', 'Encrypted backup file saved');

  // otherwise lean on the browser implementation
  saveAs(blob, filename);
};

BackupService.prototype.walletEncrypted = function(wallet) {
  return wallet.exportEncrypted(this.$rootScope.iden.password);
}

BackupService.prototype.walletDownload = function(wallet) {
  var ew = this.walletEncrypted(wallet);
  var walletName = wallet.getName();
  var copayerName = this.getCopayer(wallet);
  var filename = (copayerName ? copayerName + '-' : '') + walletName + '-keybackup.json.aes';
  this._download(ew, walletName, filename)
};

BackupService.prototype.profileEncrypted = function(iden) {
  return iden.exportEncryptedWithWalletInfo(iden.password);
}

BackupService.prototype.profileDownload = function(iden) {
  var ew = this.profileEncrypted(iden);
  var name = iden.fullName;
  var filename = name + '-profile.json';
  this._download(ew, name, filename)
};

angular.module('copayApp.services').service('backupService', BackupService);
