module.exports = {
    "env": {
        "browser": false,
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 10,
        "sourceType": "module"
    },
    "ignorePatterns": [
        "dist/",
        "static/",
        "package.json"
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
        "array-bracket-newline": [
            "error",
            {
                "multiline": true
            }
        ],
        "array-bracket-spacing": [
            "error",
            "never"
        ],
        "arrow-spacing": [
            "error",
            {
                "before": true,
                "after": true
            }
        ],
        "block-spacing": [
            "error",
            "always"
        ],
        "brace-style": [
            "error",
            "1tbs",
            {
                "allowSingleLine": true
            }
        ],
        "comma-dangle": [
            "error",
            "always-multiline"
        ],
        "comma-spacing": [
            "error",
            {
                "before": false,
                "after": true
            }
        ],
        "comma-style": [
            "error",
            "last"
        ],
        "computed-property-spacing": [
            "error",
            "never"
        ],
        "eol-last": [
            "error",
            "always"
        ],
        "func-call-spacing": [
            "error",
            "never"
        ],
        "function-call-argument-newline": [
            "error",
            "consistent"
        ],
        "function-paren-newline": [
            "error",
            "multiline"
        ],
        "generator-star-spacing": [
            "error",
            {
                "before": true,
                "after": false
            }
        ],
        "implicit-arrow-linebreak": [
            "error",
            "beside"
        ],
        "indent": [
            "error",
            4
        ],
        "jsx-quotes": [
            "error",
            "prefer-double"
        ],
        "key-spacing": [
            "error",
            {
                "beforeColon": false
            }
        ],
        "keyword-spacing": [
            "error",
            {
                "before": true,
                "after": true
            }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "lines-between-class-members": [
            "error",
            "never"
        ],
        "new-parens": [
            "error",
            "always"
        ],
        "no-multi-spaces": [
            "error",
            {
                "ignoreEOLComments": true
            }
        ],
        "no-multiple-empty-lines": [
            "error",
            {
                "max": 1,
                "maxEOF": 1,
                "maxBOF": 1
            }
        ],
        "no-trailing-spaces": [
            "error",
            {
                "ignoreComments": true
            }
        ],
        "no-whitespace-before-property": "error",
        "nonblock-statement-body-position": [
            "error",
            "beside"
        ],
        "object-curly-newline": [
            "error",
            {
                "consistent": true
            }
        ],
        "object-curly-spacing": [
            "error",
            "always",
            {
                "objectsInObjects": false,
                "arraysInObjects": false
            }
        ],
        "object-property-newline": [
            "error",
            {
                "allowAllPropertiesOnSameLine": true
            }
        ],
        "padded-blocks": [
            "error",
            "never"
        ],
        "quotes": [
            "error",
            "double",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        "rest-spread-spacing": [
            "error",
            "never"
        ],
        "semi": [
            "error",
            "always"
        ],
        "semi-spacing": [
            "error",
            {
                "before": false,
                "after": true
            }
        ],
        "semi-style": [
            "error",
            "last"
        ],
        "space-before-blocks": [
            "error",
            "always"
        ],
        "space-before-function-paren": [
            "error",
            "always"
        ],
        "space-in-parens": [
            "error",
            "never"
        ],
        "space-infix-ops": [
            "error",
            {
                "int32Hint": false
            }
        ],
        "space-unary-ops": [
            "error",
            {
                "words": true,
                "nonwords": false
            }
        ],
        "switch-colon-spacing": [
            "error",
            {
                "after": true,
                "before": false
            }
        ],
        "template-curly-spacing": [
            "error",
            "never"
        ],
        "template-tag-spacing": [
            "error",
            "never"
        ],
        "unicode-bom": [
            "error",
            "never"
        ],
        "wrap-iife": [
            "error",
            "inside"
        ],
        "wrap-regex": "error",
        "yield-star-spacing": [
            "error",
            "before"
        ]
    }
}