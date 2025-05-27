#!/bin/bash

# 创建插件目录
rm -rf plugin
mkdir -p plugin

# 复制必要文件
cp manifest.json plugin/
cp -r dist/* plugin/

# 创建图标目录
mkdir -p plugin/icons

# 删除旧的 zip 文件（如果存在）
rm -f plugin.zip

# 打包 plugin 目录
cd plugin && zip -r ../plugin.zip . && cd ..

echo "插件文件已整理到 plugin 目录并打包为 plugin.zip"