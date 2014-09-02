module.exports = function(grunt){
	var port = grunt.option('port') || '3000';

	//加载插件
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
		'grunt-contrib-less',
		'grunt-contrib-uglify',
		'grunt-contrib-cssmin',
		'grunt-hashres',
		'grunt-lint-pattern'
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});
	//配置插件
	grunt.initConfig({
		cafemocha: {
			all: {src: 'qa/tests-*.js', options: {ui: 'tdd', timeout: 15000}}
		},
		jshint: {
			app: ['meadowlark.js','public/js/**/*.js',
					'lib/**/*.js'],
			qa: ['Gruntfile.js','public/qa/**/*.js','qa/**/*.js']
		},
		exec: {
			linkchecker: {
				cmd: 'linkchecker http://localhost:'+port
			}
		},
		less: {
			development: {
				options: {
					customFunctions: {
						static: function(lessObject, name){
							return 'url("' +
								require('./lib/static.js').map(name.value) +
								'")';
						}
					}
				},
				files: {
					'public/css/main.css': 'less/main.less',
					'public/css/cart.css': 'less/cart.less'
				}
			}
		},
		uglify: {
			all: {
				files: {
					'public/js/meadowlark.min.js': ['public/js/**/*.js']
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/css/meadowlark.css': ['public/css/**/*.css',
						'!public/css/meadowlark*.css']
				}
			},
			minify: {
				src: 'public/css/meadowlark.css',
				dest: 'public/css/meadowlark.min.css'
			}
		},
		hashres: {
			options: {
				fileNameFormat: '${name}.${hash}.${ext}'
			},
			all: {
				src: [
					'public/js/meadowlark.min.js',
					'public/css/meadowlark.min.css'
				],
				dest: [
					'config.js'
				]
			}
		},
		lint_pattern: {
			view_statics: {
				options: {
					rules: [
						{
							pattern: /<link [^>]*href=["'](?!\{\{static )/,
							message: '在<link>中发现未映射的静态资源。'
						},
						{
							pattern: /<script [^>]*src=["'](?!\{\{static )/,
							message: '在<script>中发现未映射的静态资源。'
						},
						{
							pattern: /<img [^>]*src=["'](?!\{\{static )/,
							message: '在<img>中发现未映射的静态资源。'
						}
					]
				},
				files: {
					src: [
						'views/**/*.handlebars'
					]
				}
			},
			css_statics: {
				options: {
					rules: [
						{
							pattern: /url\(/,
							message: '在LESS中发现未映射的静态资源。'
						}
					]
				},
				files: {
					src: [
						'less/**/*.less'
					]
				}
			}
		}
	});
	//注册任务
	grunt.registerTask('default',['cafemocha','jshint','exec','lint_pattern']);
	grunt.registerTask('static',['less','cssmin','uglify','hashres']);
};