const HtmlWebpackPlugin = require('html-webpack-plugin');
const Excss = require('extract-text-webpack-plugin');

const path = require('path');
module.exports={
    entry:{
        app:'./public/src/entry/app.js',

    },
    output:{
        path:__dirname+'/public/dist',
        filename:'[name].js'
    },
    // resolve:{
    //     alias:{
    //         ''
    //     }
    // }
    module:{
        rules:[{
            test:/\.js$/,
            include:/public/,
            use:[
                {
                    loader:'babel-loader',
                    options:{
                        presets:[["@babel/preset-env",{
                            useBuiltIns: "usage",
                            corejs:"3.0.0",
                            modules:false,
                            targets:{
                                chrome:'80'
                            }
                        }],
                    ["@babel/preset-flow"]]
                    }
                }
            ]
        },
        {
            test:/\.css$/,
            include:/public/,
            use:Excss.extract({
                use:'css-loader'
            })
        },
        {
            test: /\.scss$/,
            include:/public/,
            use:Excss.extract({
                use:[{
                    loader:"css-loader"
                },{
                    loader:"sass-loader"
                }]
            })
        }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template:'./public/index.html',
            filename:'./index.html',
            scriptLoading:'defer'
        }),
        new Excss({
            filename:'[name].css'
        })
    ],
    devServer:{
        host:'127.0.0.1',
        port:5000,
        contentBase:'./public/dist',
        hot:true
    },
    watch:true
}