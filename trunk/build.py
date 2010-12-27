#!/usr/bin/env python

# Parchment build script
#
# Copyright (c) 2008-2010 The Parchment Contributors
# Licenced under the GPL v2
# http://code.google.com/p/parchment

# Lists of files to combine together
includes = (
	('.build/parchment.js', (
		'src/parchment/intro.js',
		'src/lib/class.js',
		'src/lib/iff.js',
		'src/plugins/querystring.js',
		'src/plugins/remedial.js',
		'src/parchment/error-handling.js',
		'src/parchment/file-chrome.js',
		'src/parchment/ui.js',
		'src/parchment/library.js',
		'src/parchment/outro.js',
	)),
	('.build/zmachine.js', (
		'src/zmachine/zui.js',
		'src/plugins/quetzal.js',
		'src/zmachine/runner.js',
		'src/zmachine/console.js',
	)),
)

# List of files to compress (with debug code removed)
compress = (
	('src/gnusto/gnusto-engine.js', 'lib/gnusto.min.js'),
	('.build/parchment.js', 'lib/parchment.min.js'),
	('.build/zmachine.js', 'lib/zmachine.min.js'),
)

import datetime
import os
import re

# Today's date
today = str(datetime.date.today())

# regex for debug lines
debug = re.compile(';;;.+$', re.M)

# Create .build directory if needed
if not os.path.isdir('.build'):
	os.makedirs('.build')

# Combine source files together to make 'packages'
for package in includes:
	print 'Building package: ' + package[0]
	output = open(package[0], 'w')
	for include in package[1]:
		data = file(include).read()
		output.write(data)
	output.close()
		
# Compress these files, requires the YUI Compressor. Icky Java
for package in compress:
	print 'Compressing file: ' + package[1]
	
	# Strip out debug lines beginning with ;;;
	data = file(package[0]).read()
	data = debug.sub('', data)
	
	# Set the date
	data = data.replace('BUILDDATE', today)
	
	# Write to a temp file
	output = open('.build/temp', 'w')
	output.write(data)
	output.close()
	
	# Compress!
	command = 'java -jar tools/yuicompressor-2.4.2.jar --type js .build/temp -o %s' % package[1]
	os.system(command)
