// cut.js
Page({
  data: {
    imagePath: '',
    processedImagePath: '',
    errorMsg: ''
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFilePaths[0],
          processedImagePath: '',
          errorMsg: ''
        });
      },
      fail: (err) => {
        this.setData({
          errorMsg: '选择图片失败：' + err.errMsg
        });
      }
    });
  },

  removeBackground() {
    if (!this.data.imagePath) {
      this.setData({
        errorMsg: '请先选择图片'
      });
      return;
    }

    const config = require('../../config/api.js');
    wx.showLoading({
      title: '正在处理中...'
    });

    // 将本地图片转换为base64
    wx.getFileSystemManager().readFile({
      filePath: this.data.imagePath,
      encoding: 'base64',
      success: (res) => {
        // 调用remove.bg API
        wx.request({
          url: config.removeBgApiUrl,
          method: 'POST',
          header: {
            'X-Api-Key': config.removeBgApiKey,
            'Content-Type': 'application/json'
          },
          data: {
            image_file_b64: res.data
          },
          responseType: 'arraybuffer',
          success: (response) => {
            // 将返回的图片数据保存为临时文件
            const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.png`;
            wx.getFileSystemManager().writeFile({
              filePath: tempFilePath,
              data: response.data,
              encoding: 'binary',
              success: () => {
                this.setData({
                  processedImagePath: tempFilePath,
                  errorMsg: ''
                });
              },
              fail: (err) => {
                this.setData({
                  errorMsg: '保存处理后的图片失败：' + err.errMsg
                });
              },
              complete: () => {
                wx.hideLoading();
              }
            });
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({
              errorMsg: '抠图处理失败：' + (err.errMsg || '请检查网络连接')
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({
          errorMsg: '读取图片失败：' + err.errMsg
        });
      }
    });
  },

  saveImage() {
    if (!this.data.processedImagePath) {
      this.setData({
        errorMsg: '请先进行抠图处理'
      });
      return;
    }

    // 检查是否有保存到相册的权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 没有权限，向用户发起授权请求
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.doSaveImage();
            },
            fail: () => {
              // 用户拒绝授权，引导用户打开设置页面
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                          this.doSaveImage();
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          // 已有权限，直接保存
          this.doSaveImage();
        }
      },
      fail: () => {
        this.setData({
          errorMsg: '获取权限失败'
        });
      }
    });
  },

  doSaveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.processedImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        let errorMessage = '保存失败';
        if (err.errMsg.includes('deny')) {
          errorMessage = '保存失败：未获得权限';
        } else if (err.errMsg.includes('fail')) {
          errorMessage = '保存失败：' + err.errMsg;
        }
        this.setData({
          errorMsg: errorMessage
        });
      }
    });
  }
})