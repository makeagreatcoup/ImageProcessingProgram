// init.js
const config = require('../../config/api.js');

Page({
  data: {
    imagePath: '',
    processedImagePath: '',
    errorMsg: '',
    photoSizes: [
      { name: '一寸', width: 25, height: 35 },
      { name: '二寸', width: 35, height: 49 },
      { name: '小二寸', width: 35, height: 45 }
    ],
    selectedSize: '一寸',
    bgColors: ['#FFFFFF', '#FF0000', '#0000FF', '#00FF00', '#FFD700', '#87CEEB'],
    selectedColor: '#FFFFFF'
  },

  onSizeChange(e) {
    this.setData({
      selectedSize: e.detail.value,
      processedImagePath: ''
    });
  },

  onColorSelect(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color,
      processedImagePath: ''
    });
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

  processImage() {
    if (!this.data.imagePath) {
      this.setData({
        errorMsg: '请先选择图片'
      });
      return;
    }

    wx.showLoading({
      title: '处理中...'
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
                // 创建画布并绘制证件照
                const size = this.data.photoSizes.find(s => s.name === this.data.selectedSize);
                const ctx = wx.createCanvasContext('photoCanvas');
                
                // 设置背景色
                ctx.setFillStyle(this.data.selectedColor);
                ctx.fillRect(0, 0, size.width * 10, size.height * 10);
                
                // 绘制人像
                ctx.drawImage(tempFilePath, 0, 0, size.width * 10, size.height * 10);
                
                // 完成绘制
                ctx.draw(false, () => {
                  // 将画布内容保存为图片
                  wx.canvasToTempFilePath({
                    canvasId: 'photoCanvas',
                    success: (res) => {
                      this.setData({
                        processedImagePath: res.tempFilePath,
                        errorMsg: ''
                      });
                      wx.hideLoading();
                    },
                    fail: (err) => {
                      this.setData({
                        errorMsg: '生成证件照失败：' + err.errMsg
                      });
                      wx.hideLoading();
                    }
                  });
                });
              },
              fail: (err) => {
                this.setData({
                  errorMsg: '保存图片失败：' + err.errMsg
                });
                wx.hideLoading();
              }
            });
          },
          fail: (err) => {
            this.setData({
              errorMsg: '处理图片失败：' + err.errMsg
            });
            wx.hideLoading();
          }
        });
      },
      fail: (err) => {
        this.setData({
          errorMsg: '读取图片失败：' + err.errMsg
        });
        wx.hideLoading();
      }
    });
  },

  saveImage() {
    if (!this.data.processedImagePath) {
      this.setData({
        errorMsg: '请先生成证件照'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.processedImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        this.setData({
          errorMsg: '保存失败：' + err.errMsg
        });
      }
    });
  }
});