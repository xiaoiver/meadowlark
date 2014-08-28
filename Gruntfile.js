module.exports = function(grunt){
	var port = grunt.option('port') || '3000';

	//加载插件
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec'
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
		}
	});
	//注册任务
	grunt.registerTask('default',['cafemocha','jshint','exec']);
};