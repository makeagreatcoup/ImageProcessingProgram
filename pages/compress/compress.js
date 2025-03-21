// compress.js
Page({
  data: {
    originalSize: '0KB',
    compressedSize: '0KB',
    compressed: false,
    imagePath: '',
    compressRate: 80,
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async res => {
        try {
          const file = res.tempFiles[0]
              const info = await new Promise((resolve, reject) => {
            wx.getFileSystemManager().getFileInfo({
              filePath: file.tempFilePath,
              success: resolve,
              fail: () => reject(new Error('文件信息获取失败'))
            })
          })
          this.setData({
            imagePath: file.tempFilePath,
            originalSize: `${info.size > 1024 * 1024 ? (info.size/(1024*1024)).toFixed(2) + 'MB' : Math.round(info.size/1024) + 'KB'}`,
            compressed: false
          })
        } catch (e) {
          wx.showToast({ icon: 'error', title: e.message || '文件选择失败' })
        }
      },
      fail: () => wx.showToast({ icon: 'error', title: '文件选择取消' })
    })
  },

  handleSliderChange(e) {
    this.setData({ compressRate: e.detail.value })
  },

  async startCompress() {
    wx.showLoading({ title: '压缩中...' })
    try {
      const { imagePath, compressRate } = this.data
      
      const { tempFilePath } = await new Promise((resolve, reject) => {
        wx.compressImage({
          src: imagePath,
          quality: compressRate,
          success: (res) => resolve(res),
          fail: (err) => reject(new Error(`压缩失败：${err.errMsg || '未知错误'}`))
        })
      })

      try {
        const info = await new Promise((resolve, reject) => {
          wx.getFileSystemManager().getFileInfo({
            filePath: tempFilePath,
            success: resolve,
            fail: () => reject(new Error('压缩文件信息获取失败'))
          })
        })

        this.setData({
          compressedSize: `${info.size > 1024 * 1024 ? (info.size/(1024*1024)).toFixed(2) + 'MB' : Math.round(info.size/1024) + 'KB'}`,
          compressed: true,
          imagePath: tempFilePath
        })
        wx.hideLoading()
      } catch (e) {
        wx.hideLoading()
        wx.showToast({ icon: 'error', title: e.message || '压缩文件获取失败' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ icon: 'error', title: err.message || '压缩失败' })
      console.error('压缩异常:', err)
    }
  },

  async saveImage() {
    try {
      const { authSetting } = await wx.getSetting({})
      if (!authSetting['scope.writePhotosAlbum']) {
        const { confirm } = await wx.showModal({
          title: '权限提示',
          content: '需要相册权限以保存图片',
          confirmText: '去授权'
        })
        if (confirm) await wx.openSetting()
        return
      }

      await wx.saveImageToPhotosAlbum({
        filePath: this.data.imagePath
      })
      wx.showToast({ title: '保存成功' })
    } catch (e) {
      wx.showToast({ 
        icon: 'error', 
        title: e.errMsg.includes('auth') ? '保存权限被拒绝' : '保存失败'
      })
    }
  }
  }
)