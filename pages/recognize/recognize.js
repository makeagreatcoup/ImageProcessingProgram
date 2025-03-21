// recognize.js
Page({
  data: {
    imagePath: '',
    result: '',
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
          result: '',
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

  recognizeImage() {
    if (!this.data.imagePath) {
      this.setData({
        errorMsg: '请先选择图片'
      });
      return;
    }

    const config = require('../../config/api.js');
    wx.showLoading({
      title: '正在识别中...'
    });

    // 将本地图片转换为base64
    wx.getFileSystemManager().readFile({
      filePath: this.data.imagePath,
      encoding: 'base64',
      success: (res) => {
        // 获取图片格式
        const imageFormat = this.data.imagePath.split('.').pop().toLowerCase();
        const base64Prefix = `data:image/${imageFormat};base64,`;
        const base64Data = base64Prefix + res.data;

        // 调用火山引擎API
        wx.request({
          url: config.arkApiUrl,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${config.arkApiKey}`,
            'Content-Type': 'application/json'
          },
          data: {
            "model": "ep-20250125153900-7jmrx",
            "messages": [
              {
                "role": "user",
                "content": [
                  {
                    "type": "text",
                    "text": "识别图片"
                  },
                  {
                    "type": "image_url",
                    "image_url": {
                      "url": base64Data
                    }
                  }
                ]
              }
            ]
          },
          success: (response) => {
            if (response.data && response.data.choices && response.data.choices[0]) {
              this.setData({
                result: response.data.choices[0].message.content,
                errorMsg: ''
              });
            } else {
              this.setData({
                errorMsg: '识别结果解析失败'
              });
            }
          },
          fail: (err) => {
            this.setData({
              errorMsg: '识别请求失败：' + (err.errMsg || '请检查网络连接')
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
          errorMsg: '读取图片失败：' + err.errMsg
        });
      }
    });
  },

  saveResult() {
    if (!this.data.result) {
      this.setData({
        errorMsg: '请先进行图片识别'
      });
      return;
    }

    // 将识别结果保存到本地文件
    const fs = wx.getFileSystemManager();
    const fileName = `recognize_result_${Date.now()}.txt`;
    
    fs.writeFile({
      filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
      data: this.data.result,
      encoding: 'utf8',
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
})