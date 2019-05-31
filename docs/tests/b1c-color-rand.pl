#!/usr/bin/env perl
# Use this with "Script" Event Source set to "parse as color"
# Generates a random RGB hex code (e.g. '#F3027E') every time it is run

my $color = join '', map { sprintf "%02x", rand(255) } (0..2);

print '#',$color,"\n";
